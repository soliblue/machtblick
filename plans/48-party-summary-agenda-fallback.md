# 48 Party Summary Agenda Fallback

## Goal

Generate party position summaries for recorded votes whose speeches are matched through `votes.agenda_item` but not materialized into `speeches.vote_id`.

## Scope

- Keep exact `speeches.vote_id` matches as the first source.
- Fall back to same-day `speeches.agenda_item` when a vote has no exact speech links.
- Preserve party filtering and chair-role exclusion.
- Keep the prompt honest about how speeches were selected.

## Status

- Completed.

## Log

### lead

- Found that the Stromsteuer vote has `votes.agenda_item = Tagesordnungspunkt 6`, while all 59 speeches for that block have `speeches.vote_id IS NULL`.
- Confirmed the vote page already reads same-day agenda speeches, while the party-position ETL only reads exact vote-linked speeches.
- Updated `etl/bundestag/party-positions/run.mjs` so party summaries use exact vote-linked speeches first, then same-day agenda speeches for the same party.
- Updated the prompt wording so the speech source description covers both matching modes.
- Verified syntax with `node --check` for the runner and prompt.
- Probed the Stromsteuer vote with the real word threshold. AfD, B90/Grüne, CDU/CSU, Die Linke, and SPD are now eligible. Fraktionslos remains skipped because it has no speeches.
- Ran the real party-position ETL for the Stromsteuer vote. It generated five local summaries and wrote audit rows with the source speech counts.
- Ran the full party-position ETL with the agenda fallback. Local German coverage is now 49 votes and 248 party rows, with zero eligible rows missing.
- Attempted to translate the new party-summary rows. The translation runner wrote partial English coverage, then stalled repeatedly on a targeted remaining vote with both `gpt-5.2` and `gpt-5.4-mini`. English coverage remains 36 votes and 182 party rows, leaving 13 vote pages to translate later.
