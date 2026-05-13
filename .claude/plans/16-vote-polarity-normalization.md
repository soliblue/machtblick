# 16 — Vote polarity normalization

## Goal

Some Bundestag votes are framed as "Beschlussempfehlung des Ausschusses zur **Ablehnung** des Antrags X" — the chamber votes on a recommendation to *reject* the underlying Antrag, so a Ja-vote means "yes, reject" and the result label is doubly inverted. Today the UI papers over this with a warning icon + tooltip in `VoteTitle.tsx`. We bake the inversion into the data: rewrite the title, flip yes/no, flip member choices, flip the result. Mark `inverted = true` so a callout on the detail page can disclose what we did. Originals are not stored — the ETL cache (raw protocol XML + DIP JSON, keyed by stable Drucksache IDs) is the source of truth if we ever need to recover.

## Status

| Workstream | Owner | State |
|---|---|---|
| Schema: `votes.inverted` column + migration | plumber | done |
| Detection + inversion ETL pass | plumber | done |
| Delete `VoteTitle.tsx` workaround | frontend | done |
| Callout on vote detail page when `inverted = true` | frontend | done |

## Contracts

### Schema (`db/schema/votes.ts`)

Add one column:

| Column | Type | Notes |
|---|---|---|
| `inverted` | `integer` (boolean, default 0) | True when the canonical row was rewritten away from procedural framing |

No `original_*` columns. The ETL cache + Drucksache IDs are the audit trail.

### Inversion semantics

When `inverted = true`, the following have been overwritten in place:

| Table.column | Original (Beschlussempfehlung-zur-Ablehnung framing) | Normalized |
|---|---|---|
| `votes.title` | "Beschlussempfehlung … Ablehnung des Antrags X …" | Underlying Antrag wording. Strip the procedural wrapper. The LLM does this; don't hand-roll regex. |
| `votes.yes` ↔ `votes.no` | counts on the rejection-recommendation | swapped |
| `votes.result` | `angenommen` (rejection passed → Antrag dead) | `abgelehnt` |
| `member_votes.choice` | `ja`/`nein` on the rejection | flipped: `ja` ↔ `nein`. `enthalten` and `nicht_abgegeben` untouched |
| `member_votes.defected` | computed | recomputed from the flipped data (symmetric flip preserves defection) |

### Detection

Three-tier:

1. **Rule pass** — title regex (`Ablehnung des Antrags`, `Antrag … abzulehnen`, `Empfehlung … Ablehnung`) + Drucksache `Vorgangsart` from DIP (`Beschlussempfehlung`). Catches most cases.
2. **LLM judgment** for the ambiguous remainder. Per the new CLAUDE.md rule: shell out to `claude -p --model sonnet --output-format json`, prompt receives the title + Drucksache abstract (if available), output strict JSON: `{ inverted: boolean, rewrittenTitle: string | null, reason: string }`. No SDK, no API key.
3. **Skip** if confidence is low — better an un-normalized row than a wrongly-flipped one.

The LLM also produces the rewritten `title` in one go (cleaner than rule-stripping the procedural shell).

### Idempotency

`WHERE inverted = 0 AND <detection-not-yet-run-marker>` — pick a sensible marker (probably a `polarity_checked` boolean, or just key off whether the row exists in a side cache of decisions). Re-running processes only new rows.

### Frontend

| File | Change |
|---|---|
| `apps/bundestag/src/views/votesList/VoteTitle.tsx` | Delete lines 11–50 (the rejection-prefix detection + warning icon + tooltip). Replace component body with a plain `<span>{title}</span>`. Or, if nothing else uses the component, inline it at call sites and delete the file |
| `apps/bundestag/src/views/voteDetail/...` | Add a callout block at the top of the detail page when `vote.inverted === true`. Copy: "Wir haben das Vorzeichen dieser Abstimmung umgedreht, damit das Ergebnis klar lesbar ist. Im Original ging es um die *Ablehnung* dieses Antrags — wir zeigen das Ergebnis so, als wäre direkt über den Antrag abgestimmt worden." Style: muted surface tile, sharp corners, no icon decoration |

### Server / type changes

`apps/bundestag/src/server/votes.ts` already passes `votes.*` through unchanged. Expose `inverted: boolean` on the vote detail return type so the callout can read it. List items don't need the flag.

## Open questions

None. Originals are not preserved; cache is the source of truth.

## Log

- 2026-05-13 lead: plan created. Explore audited the codebase — only `VoteTitle.tsx` lines 11–50 currently compensate; everything else passes raw values through. Dispatching plumber for schema + ETL.
- 2026-05-13 plumber: schema + ETL done.
  - Added `votes.inverted` (boolean, default 0) and a new `vote_polarity_decisions` side table. Hand-wrote migration `0011_vote_polarity.sql`, applied via sqlite3, registered in `_journal.json` and `__drizzle_migrations` per the documented drift workaround. Side table chosen over a `polarity_checked` flag because it captures the decision (source, confidence, reason, original/rewritten title) — the `votes.inverted` flag stays as the user-facing signal AND the re-flip guard.
  - ETL under `etl/bundestag/polarity/`: `rule.mjs` (title patterns + DIP-cache lookup + procedural-shell stripper), `llm.mjs` (claude -p sonnet --output-format json), `apply.mjs` (atomic flip: choices → positions → recompute result from new state → update votes), `proposer.mjs`, `limit.mjs` (homegrown p-limit, no deps), `run.mjs` (main). Concurrency 4 on the LLM loop.
  - Result column: never blindly flipped. For namentlich, recomputed from post-flip yes/no. For handzeichen (no counts), seat-weighted majority across post-flip positions. Invariant to whether db:normalize touched the row.
  - Initial run on WP21: **scanned=281, rule_hits=0, llm_hits=20, llm_low_skipped=0, inverted_total=20, defection_mismatch=0**. All 20 LLM hits high-confidence with sensible rewritten titles (Pendler-Antrag, Übergewinnsteuer, Verbrenner-Verbot, etc.). Rule pass hit 0 because the namentlich Drucksache numbers aren't in the handzeichen DIP cache; rule code remains in place and will pay off once the cache widens. No defection mismatches.
  - One bug caught + fixed mid-run: my first flipResult logic for handzeichen rows assumed db:normalize hadn't touched them; in reality db:normalize had inconsistent coverage. Rewrote to compute result from the post-flip state in both namentlich and handzeichen cases. Existing already-inverted rows were repaired with a one-shot (deleted after use).
  - Wired into `handzeichen/refresh.mjs` chain (runs after proposers.mjs) and exposed as `npm run etl:polarity`. Server type `VoteDetail.vote` auto-includes `inverted: boolean` via `typeof votes.$inferSelect` — no change needed in `apps/bundestag/src/server/votes.ts`. Frontend takes over.
- 2026-05-13 frontend: workaround removed + callout added.
  - `VoteTitle.tsx` had two call sites with distinct styling (list row vs. detail h1). Inlined both as plain spans/h1 and deleted the file — fits "no single-use components" since each call site now carries its own one-line render.
  - `VoteRow.tsx`: replaced `<VoteTitle title={vote.title} />` with the original list styling inlined.
  - `VoteDetail.tsx`: replaced the h1 invocation with a plain `<h1>`, and inserted the inversion callout above it (only when `vote.inverted`). Used `bg-surface p-m text-s` with sharp corners, no icon, *Ablehnung* italicized via `<em>`, `mb-l` below.
  - Typecheck: only a pre-existing unrelated error in `src/server/parties.ts` (PartyVoteRow.cohesion null mismatch); no errors in touched files.
