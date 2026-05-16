# 31 — Party position summaries from speeches

## Goal

For every namentlich vote that has plenary speeches attached, generate a per-party narrative summary of **why that party voted the way it did**, derived from what its MdBs said in the debate. Most fractions vote in lock-step, so a single 1-2 sentence stance plus the three or four key arguments captures the position well. Surfaces on the vote detail page so a visitor can read "CDU/CSU said X, SPD said Y" without slogging through every speech.

## Status

| Workstream | Owner | State |
|---|---|---|
| Designer mock for the per-party summary block | designer | done |
| Schema: extend `vote_party_summaries` with narrative fields | plumber | done |
| ETL: `etl/party-positions/` runner | plumber | done |
| Backend: expose narrative fields on `VoteDetail` | backend | done |
| Frontend: render narrative summaries in vote detail | frontend | done |

## Approach

### What we generate, per (vote, party)

Three fields, all derived from the party's speeches for that vote:

| Field | Type | Shape |
|---|---|---|
| `position_summary` | text | 1-2 sentences, plain language, in German. States the party's stance and the core reason. No procedural framing. |
| `key_points` | text | Markdown bullet list (3-5 items). Each bullet is one substantive argument or claim made by speakers of that party. Inline `**bold**` allowed for emphasis. |
| `dissent_note` | text (nullable) | Set when the party's `position` is `mixed` or when any speaker visibly broke ranks. One sentence describing the split. Null otherwise. |

All neutral, no editorializing. The party already said it; we condense.

### Schema

Extend the existing `vote_party_summaries` table. The positional columns (yes/no/abstain) stay; we add three text columns:

```
ALTER TABLE vote_party_summaries
  ADD COLUMN position_summary TEXT,
  ADD COLUMN key_points TEXT,
  ADD COLUMN dissent_note TEXT;
```

Side table for idempotency, scoped to this feature so we can bump prompt versions independently:

```
vote_party_summary_decisions (
  vote_id, party PK,
  source_speech_ids TEXT,   -- JSON array, for audit
  model,
  prompt_version,
  generated_at
)
```

### Candidate selection

A row is eligible when:

- `votes.vote_type = 'namentlich'` and `votes.procedural = 0`.
- At least one speech exists with `speeches.vote_id = votes.id` and `speeches.party = <party>`.
- Speeches from chair roles (`Präsident*`, `Vizepräsident*`, `Alterspräsident*`) are excluded — already a filter pattern in `vite.config.ts`.
- Speeches from ministerial/government roles are kept but flagged in the prompt so the LLM weights backbench voices appropriately when the speaker is a federal minister speaking ex officio.

Expected volume: ~42 namentlich non-procedural votes have at least one attached speech. 6 fractions present in the 21st Wahlperiode (CDU/CSU, SPD, AfD, B90/Grüne, Die Linke, fraktionslos). Upper bound ~250 (vote, party) cells; in practice fraktionslos rarely speaks so closer to ~200.

### LLM call

One Sonnet call per (vote, party). Stdin:

- The vote's `clean_title` and `summary_simplified`.
- The party's stance from `vote_party_summaries.position` (`yes`/`no`/`abstain`/`mixed`) plus the breakdown counts.
- A concatenation of that party's speeches for the vote: speaker name + role + speech `text_full`. Order by `position` (debate order).
- Instruction to return strict JSON:

  ```json
  {
    "position_summary": "...",
    "key_points": ["...", "...", "..."],
    "dissent_note": null
  }
  ```

Prompt rules (lock in `etl/party-positions/prompt.mjs`):

- German output, neutral tone, ~10th-grade reading level.
- `position_summary`: 1-2 sentences, max ~50 words. State the position and the core reason.
- `key_points`: 3-5 bullets, each ≤ ~25 words, each a substantive argument that actually appeared in the speeches. No padding bullets to hit a count.
- `dissent_note`: only set if the party split (mixed) or if a speaker explicitly disagreed with the majority of their fraction. Otherwise null.
- Stay close to what speakers said. No invented arguments. No party-political framing ("Die Fraktion fordert", "Die SPD will"). Speak the argument directly.
- No mention of other parties' positions. Single-party perspective only.
- No procedural references ("§§", Drucksachennummer) unless a speaker hung an argument on one.
- No em dashes.

Concurrency: 4 parallel Sonnet calls via the shared limiter.

### Backend

`VoteDetail.partySummaries[i]` already exists in the server return type via `$inferSelect`. The three new columns flow through automatically. No bespoke field to add. The frontend just needs to render them when non-null.

### Frontend

In `apps/bundestag/src/views/voteDetail/ResultTab.tsx`, add a new block titled `Positionen der Fraktionen` between the existing donut/waffle section and the `Details zum Antrag` callout. The block contains one card per party, ordered by seat count (matching how parties already sort on the page).

Card layout (designer to validate):

```
+--------------------------------------------------------------+
|  ● CDU/CSU                    [zugestimmt]   23 von 24       |
|                                                              |
|  Zwei Sätze, die die Position der Fraktion zusammenfassen.  |
|                                                              |
|  • Erstes Argument                                           |
|  • Zweites Argument                                          |
|  • Drittes Argument                                          |
|                                                              |
|  Drei Abweichler stimmten dagegen — Begründung kurz.        |
+--------------------------------------------------------------+
```

- Party-color dot on the left of the name (already a primitive on the page).
- Stance pill using the existing `success`/`danger` accent mapping: `zugestimmt` / `abgelehnt` / `enthalten` / `gemischt`.
- Vote tally on the right (e.g. `23 von 24`).
- `position_summary` rendered with `MarkdownInline`.
- `key_points` rendered with the block `Markdown` component as a `<ul>`.
- `dissent_note` only renders when non-null, in `text-s` `opacity-l`.

If a (vote, party) cell has no `position_summary` (no speeches from that party, or ETL hasn't run yet), the card is omitted entirely for that party — no empty state, no placeholder. The donut still tells the full story upstream.

A small footer line under the whole block: `Aus den Plenarreden zusammengefasst (KI). Originalreden im Reden-Tab.` — same disclosure pattern as the existing AI callout on `Details zum Antrag`.

### Designer deliverable

ASCII mock at `apps/bundestag/src/views/voteDetail/PartyPositionsBlock.mock.md` showing:

- Card layout on desktop and mobile (single column on mobile).
- How parties stack when 4-6 cards are present.
- Hierarchy: party name vs stance pill vs tally — what's biggest, what's mid, what's small.
- Where the disclosure line sits (top, bottom, per-card?).

## Estimation

**Effort:** ~1.5 specialist days end-to-end.

1. designer — mock (an hour).
2. plumber — schema migration + `etl/party-positions/` runner (half a day).
3. backend — nothing beyond confirming `$inferSelect` picks up the new columns.
4. frontend — `PartyPositionsBlock.tsx` + per-card subcomponent, slot into `ResultTab.tsx` (half a day).
5. Manual spot check on 5-10 votes across stances (mixed cases especially) before flipping it on for everyone.

**LLM budget via `claude -p sonnet`:**

- Roughly 200-250 calls one-shot to backfill the existing namentlich votes with speeches.
- Easily fits inside one Max-tier daily window. Effectively a free run.
- Going forward, each new debate-attached vote adds ~6 calls — negligible. Wire into the existing `etl/refresh.mjs` chain after `bundestag-reden` ingest.

**Should we do it?** Yes. The volume is small, the user-value is high — this is the single hardest-to-extract signal in the entire dataset right now (most visitors won't read four 1000-word speeches to figure out why a fraction voted no). It also pairs naturally with plan 30: once we have these narrative fields, they're high on the Priority 1 translation list because they're short and prominent.

## Open questions

- Should the block sit before or after the Abweichler list in `ResultTab`? Lead leaning before — the narrative answers "why" before the dissent list shows "who didn't follow it". Designer to settle in the mock.
- For votes where only 1-2 speakers from a party spoke (often the case for fraktionslos), is the summary still useful or does it become a paraphrase of a single quote? Plumber to add a min-word threshold (~150 words) below which we skip the cell rather than generate something thin.
- Government-bench speeches: a federal minister speaking for the cabinet may not represent the rank-and-file fraction line. Mark `speaker_role` in the prompt so the LLM can weight; revisit if the output skews.
- Do we ever want a cross-party "what they fought about" summary (top-level, one paragraph)? Out of scope for this plan but worth a follow-up — likely cheaper to derive from the per-party outputs than from the raw speeches.

## Log

- 2026-05-14 lead: plan created at user's request — feature parked, not started.
- 2026-05-15 lead: completed party position summaries for linked debate votes, translated the generated summaries to English and surfaced them from the vote detail party summary modal.
