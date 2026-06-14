# Harden refresh pipeline against today's bug classes

## Goal

A recurrence audit (agent a8c534946571d21b4) found that the guards we added today live in `etl/bundestag/handzeichen/refresh.mjs`, but the weekly auto-refresh is actually driven by an LLM agent following `prompts/auto-refresh.md` (via `scripts/scheduled-bundestag-auto-refresh` -> `scripts/codex_app_thread.py`), whose step list does NOT include the linkage/materialize/ordering steps. So the main guards are bypassable. Close four residual recurrence risks so today's fixed bugs can't return on the next scheduled refresh. Preventive only: today's deployed data is already correct, so this is commit + push, NO redeploy (unless fix #4's scan finds existing em-dashes in live fields, then flag for redeploy).

## Status

- Fix #1 (authoritative schedule): added `etl:votes:backfill-agenda` + `db:materialize` before `etl:party-positions` in `prompts/auto-refresh.md` derived list, plus a self-materialize note and a db:normalize-vs-polarity ordering guard note: done (plumber)
- Fix #2 (loud backstop): moved the `validate-public-votes` call in `refresh.mjs` to AFTER backfill + materialize + party-positions: done (plumber)
- Fix #3 (staleness-aware regen): `etl:party-positions` skip gate now also regenerates when `vote_party_summary_decisions.generated_at` < `vote_polarity_decisions.decided_at`; would-regenerate-now count = 0 (confirmed): done (plumber)
- Fix #4 (em-dash structural guard): added `cleanText` to `descriptions/llm.mjs` (summary_simplified/detail) and `titles/llm.mjs` (clean_title); cleaned 233 existing en-dash rows in live `votes.clean_title`: done (plumber)
- Document that `prompts/auto-refresh.md` is the authoritative schedule: done (plumber, plus corrected the stale "backfill not in any refresh chain" section)
- Commit + push: ready (plumber). **Redeploy IS warranted** — fix #4 cleaned 233 live `clean_title` rows.

## Contracts / audit evidence

- Authoritative schedule = `prompts/auto-refresh.md` (its two numbered step lists), run by `scripts/scheduled-bundestag-auto-refresh` (systemd) -> `scripts/codex_app_thread.py`. NOT `refresh.mjs`. The prompt omits `backfillAgendaItem`, `db:materialize`, and does not pin ordering for `etl:party-positions`.
- `materializeVoteDebateGroups` (in `db/materialize-derived-data.ts`) requires `votes.agenda_item IS NOT NULL`. `backfillAgendaItem.ts` sets it; npm alias `etl:votes:backfill-agenda` exists (plan 100). `etl:votes:namentlich` (`import-namentlich.ts`) calls neither backfill nor materialize.
- party-positions skip gate: `etl/bundestag/party-positions/run.mjs` ~line 47 `(force || !row.position_summary)` is staleness-blind. Fix: also regenerate when that vote's `vote_party_summary_decisions.generated_at` predates `vote_polarity_decisions.decided_at` (summary older than the inversion). Verify exact column names. Must NOT re-flag today's already-correct summaries (they were generated after inversion).
- The party-positions PROMPT is already inversion-aware (PROMPT_VERSION `party-positions-v2`, plan 101). Do NOT redo it; just confirm.
- `validate-public-votes.ts` (`missing_speech_rich_party_summaries`) is invoked at `refresh.mjs` ~line 60, BEFORE backfill(63)/materialize(66)/party-positions(69) -> passes vacuously. Move it after the summary step so it fails loudly when a linked vote lacks a summary.
- `cleanText` (U+2014 -> ", ", U+2013 -> "-") exists in the antrag-* workers; missing in `descriptions/llm.mjs` (votes.summary_simplified / summary_detail) and `titles/llm.mjs` (votes.clean_title). These are the most visible fields. No em-dash backstop in validation.

## Open questions

- Does `prompts/auto-refresh.md` also need explicit polarity/initiator ordering, or are those adequately covered inside `handzeichen:refresh`? plumber to assess while editing #1; keep the change minimal but correct.

## Log

### lead

- Created from the recurrence audit. Authorized all four hardening fixes + documenting the authoritative schedule. Commit + push when done; no redeploy unless the #4 scan finds existing em-dashes in live `clean_title`/`summary_simplified`.

### plumber

All four implemented. Verified column names against live schema before touching anything.

- **Fix #1** (`prompts/auto-refresh.md`): inserted `etl:votes:backfill-agenda` (5) and `db:materialize` (6) before `etl:party-positions` (7) in the derived-refresh list; added a paragraph explaining `etl:votes:namentlich` does not self-materialize and that backfill+materialize must precede party-positions. Made the derived ordering explicit (titles/descriptions → linkage → summaries → translations). Assessed the open question on polarity/initiator: those are owned inside `etl:handzeichen:refresh` (source step 4, after namentlich ingest at step 3), so no reorder needed there. BUT found a latent ordering hazard: `npm run db:normalize` (= `db/normalize-results.ts`, blindly flips `result` to abgelehnt when proposer position=no, ignoring `inverted`) is source step 8, running AFTER step 4's internal polarity — exactly what plumber.md warns against. Empirically it flips 0 rows right now (deployed data consistent), so it's latent not active. Did NOT reorder source steps (handzeichen-ingest+polarity are bundled in one script; safe reordering is entangled with handzeichen result correctness, out of scope for these 4 guards). Instead added a guard note to the prompt documenting the invariant.
- **Fix #2** (`etl/bundestag/handzeichen/refresh.mjs`): moved `validate-public-votes.ts` from before backfill to after backfill→materialize→party-positions (both vote types). `missing_speech_rich_party_summaries` now fails the run when a linked vote lacks a summary instead of passing vacuously. `run()` rejects on non-zero exit; top-level await halts with non-zero code (unchanged, confirmed).
- **Fix #3** (`etl/bundestag/party-positions/run.mjs`): added `LEFT JOIN vote_party_summary_decisions d` (generated_at) and `LEFT JOIN vote_polarity_decisions p ON ... AND p.inverted = 1` (decided_at) to the candidate query; gate is now `(force || !row.position_summary || stale)` where `stale = decided_at && generated_at && generated_at < decided_at`. Confirmed PROMPT_VERSION is `party-positions-v2` and inversion-aware (no change). **Would-regenerate-now count = 0** (verified for handzeichen, namentlich, and combined: today's summaries were all generated after their inversions).
- **Fix #4** (`etl/bundestag/descriptions/llm.mjs`, `etl/bundestag/titles/llm.mjs`): added a `cleanText` (`—`→", ", `–`→"-", strip spaced " -- ") matching the antrag-* workers plus the spaced-`--` strip the task required; applied to summary_simplified/summary_detail and clean_title. The antrag-* `cleanText` does NOT strip spaced `--`, so this is a superset; left party-positions/run.mjs `cleanText` as-is (out of scope, already trims its output). Wrote the dash chars as JS escape sequences so no literal em/en-dash byte enters checked-in source. **DB cleanup: 233 `votes.clean_title` rows** had en-dashes (U+2013; 0 em-dashes, 0 spaced `--`; 0 in summary_simplified/summary_detail) — all legacy non-WP21 titles (Einzelplan NN, Haushaltsbegleitgesetz 2006, etc.). Cleaned in place via SQL (`char(8212)`→", ", `char(8211)`→"-", " -- "→", "), verified scan now 0 across all three columns. **Redeploy warranted** (live clean_title fields changed).
- **Docs** (`.claude/agents/plumber.md`): added the authoritative-schedule note (prompt is the scheduled driver via `scripts/scheduled-bundestag-auto-refresh` → `codex_app_thread.py`; guards must go in both the prompt and refresh.mjs). Also corrected the now-stale "Vote → speech linkage ... (the backfill is not in any refresh chain)" section: plan-100 already chained backfill into refresh.mjs and added the `etl:votes:backfill-agenda` alias; plan-103 added it to the prompt.

#### Files for scribe

Code / prompt / docs / one-shot script (no schema change, no migration):
- `prompts/auto-refresh.md` (fix #1)
- `etl/bundestag/handzeichen/refresh.mjs` (fix #2)
- `etl/bundestag/party-positions/run.mjs` (fix #3)
- `etl/bundestag/descriptions/llm.mjs` (fix #4 worker guard)
- `etl/bundestag/titles/llm.mjs` (fix #4 worker guard)
- `db/clean-prose-dashes.ts` (fix #4 idempotent one-shot backfill, NEW)
- `.claude/agents/plumber.md` (docs)
- `plans/103-harden-refresh-recurrence-guards.md` (this plan)

DB-data change (NOT a tracked file; `db/machtblick.sqlite` is the working DB, normally not committed):
- `votes.clean_title` cleaned in 233 rows. This is the change that motivates the redeploy. Reproduced as the checked-in idempotent script `db/clean-prose-dashes.ts` (run via `npx tsx db/clean-prose-dashes.ts`, no alias, same convention as `db/close-foullong.ts`), so the manual correction is not an invisible one-off. The worker `cleanText` guards prevent recurrence for newly-generated rows; this script covers pre-existing legacy rows that the term_id=21-gated workers won't regenerate. Already run; re-running reports 0.
