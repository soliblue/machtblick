# 27 — Speech↔vote linkage: cover namentlich-only sessions, and TOPs hosting >1 vote

## Goal

Two bugs in the speech→vote linkage surfaced by `/votes/2025-12-05-987-…-russischem-staatsvermogen`:

1. **Session-derivation gap.** `etl/bundestag-reden-xml/ingest.ts` derives `sessionId` for each vote by matching `^pp21-(N)-` on its id, falling back to `sessionByDate.get(date)` which is also seeded only from `pp21-` ids. Namentliche votes use the date-shaped id (`{date}-{bid}-{slug}`) and on dates with only namentliche votes (zero handzeichen, e.g. 2025-12-05) no `pp21-` row exists to seed `sessionByDate`. Result: namentliche votes that day get `sessionId = null`, never enter `votesByTop`, and every speech in that session (all 294 in 21-48) has `vote_id = NULL`.
2. **Multi-vote TOPs collapse.** When a single TOP hosts >1 namentlich vote (e.g. TOP 32 on 2025-12-05 carries both vote 987 *Eingefrorenes russisches Staatsvermögen* and vote 988 *Russische Atomgeschäfte*), `resolveVoteId` returns `top[0]` and only one of the two votes ever shows speeches. The reader (`loadDebateForVote` in `apps/bundestag/src/server/votes.ts`) is `WHERE speeches.vote_id = $id`, so the loser shows zero speeches even after we fix (1).

Plan 11 already noted that the *proper* join is `(speeches.date, speeches.agenda_item) = (votes.date, votes.agenda_item)` and reaches 198/300 votes vs 116/300 via the singular `speeches.vote_id` column. We just never updated the read path.

## Approach

Two complementary fixes:

### A. Plumber — ETL: stop relying on `pp21-` ids for session derivation
In `etl/bundestag-reden-xml/ingest.ts`:

- Build the session-derivation map directly from the speech XML filenames we already iterate (`21048.xml` → `21-48`), keyed by **date** (read from the first `<rede>` row's `date`, or `<sitzung-datum>` in the protocol header). That map is authoritative for every session we ingest, independent of which vote types occurred that day.
- Use this map (instead of regexing vote ids) when building `votesByTop` / `votesBySession`.
- Keep the multi-vote-per-TOP behavior of picking `top[0]` for the singular `speeches.vote_id` column — that column is informational; the read path moves to the M2M join (below).

Re-run `etl:speeches:xml`. Report new `vote_id` linkage counts and verify 21-48 now has non-null `vote_id`s.

### B. Backend — read path: join on (date, agenda_item), not on vote_id
In `apps/bundestag/src/server/votes.ts`, `loadDebateForVote(voteId)`:

- Look up the vote's `date` + `agendaItem` (already on `votes` from plan 11).
- If `agendaItem` is non-null: `SELECT … FROM speeches WHERE date = $date AND agenda_item = $agenda ORDER BY position`.
- If `agendaItem` is null: fall back to the current `WHERE vote_id = $id` (preserves the prior best-effort behavior for the 23 votes plan-11 couldn't backfill).

This naturally fixes (2): both vote 987 and vote 988 share `(2025-12-05, "Tagesordnungspunkt 32")` and both will list all 15 speeches of that debate. Semantically correct — the debate covered both motions jointly.

No schema change. No M2M junction table — the join key `(date, agenda_item)` is already the natural M2M; materializing it as a table would be redundant.

## Contracts (unchanged)

- `SpeechSummary` shape stays as-is.
- `VoteDetail.debate: SpeechSummary[]` stays as-is.
- `speeches.vote_id` column stays (for `/members/$id`-style direct lookups and as a debugging aid); semantics: "canonical primary vote when the TOP hosts exactly one namentlich vote, else one of several".

## Acceptance

- `/votes/2025-12-05-987-ablehnung-eines-antrags-zu-eingefrorenem-russischem-staatsvermogen` shows the 15 Reden of TOP 32 (Schraps SPD, Hoffmann CDU/CSU, Vandre Linke, Dorn CDU/CSU, Keuter AfD, …).
- `/votes/2025-12-05-988-ablehnung-eines-antrags-zu-russischen-atomgeschaften` shows the same 15 Reden.
- Re-running plumber: every session whose XML we have produces speeches with non-null `vote_id` wherever the TOP is unique to one vote.

## Status

- plumber: done (A) — 2026-05-14
- backend: done (B) — 2026-05-14

## Log

### 2026-05-14 — plumber, section A

Files touched:
- `etl/bundestag-reden-xml/ingest.ts` — flipped the order: parse all XML files first into `parsedProtocols: SpeechRow[][]`, seed `sessionByDate` from the first row of each parsed protocol (authoritative date+sessionId straight from the XML's `<sitzung-datum>` and `<plenarprotokoll-nummer>/<sitzungsnr>`), then build `votesBySession`/`votesByDate`/`votesByTop` from the DB using that map. Dropped both the `^pp21-(\d+)-/` regex paths. Resolver, sort, fallback order, and `is_petition_bundle`/procedural handling all untouched per plan.

Coverage delta (baseline → after fix):
- Speeches with vote_id: 7168 → 7374 (+206)
- Distinct votes with ≥1 speech: 116 → 120 (+4)
- Session 21-48: 0/294 → 206/294 linked (TOP 32 → 2025-12-05-987-…-staatsvermogen, TOP 27 → 984, TOP 29 → 986, ZP 6 → 985; the 88 NULLs are speeches in TOPs without any namentlich vote that day — expected).
- 2025-12-05 vote 988-…-atomgeschaften shares TOP 32 with 987; per plan, sort tie-break gave `top[0]=987`. Backend's `(date, agenda_item)` join in step B will surface the 15 TOP-32 Reden on both vote pages.

No surprises. The +4 votes / +206 speeches improvement is roughly what we expected for a single namentlich-only day (294 speeches in 21-48 alone), reduced by the 88 unlinked TOPs in that session. Other sessions were already covered via the (now-removed) `pp21-` path; the new authoritative date-map path is a strict superset on this dataset.

Handing off to backend: read path swap in `apps/bundestag/src/server/votes.ts > loadDebateForVote`.

### 2026-05-14 — backend, section B

Files touched:
- `apps/bundestag/src/server/votes.ts` — `loadDebateForVote(voteId)` → `loadDebateForVote(voteId, date, agendaItem)`. New query shape: `WHERE date = $date AND agenda_item = $agendaItem ORDER BY position` when `agendaItem` is non-null, falling back to `WHERE vote_id = $id` otherwise. Added `and` to the `drizzle-orm` import. Single call site in `getVote` now passes `voteRow.date` and `voteRow.agendaItem`. `SpeechSummary` shape and `SPEECH_PARTY_NORMALIZE` untouched; no type changes.

Build: `cd apps/bundestag && npm run build` → exit 0, no errors, no warnings, all routes prerendered.

Sanity numbers:
- `votes` 987 and 988 both have `(date=2025-12-05, agenda_item='Tagesordnungspunkt 32')` — confirmed via sqlite.
- `SELECT COUNT(*) FROM speeches WHERE date='2025-12-05' AND agenda_item='Tagesordnungspunkt 32'` → 15. Both vote pages now resolve to the same 15-Reden TOP-32 debate, which is the acceptance criterion.
