# Recent-vote derived data: summaries, roll-call, refresh order

## Goal

Recent votes show incomplete or inconsistent derived text. Three fixes before we ship, then one rebuild + deploy (which also ships the still-unshipped plan 101 fixes):

1. **Missing party summaries.** The session-83 votes got their speech linkage backfilled in plan 100 today, but the party-position summary pipeline last ran 2026-06-13 (before that linkage), so it saw zero speeches and produced nothing. Generate them now.
2. **Stale `votes.summary` roll-call.** The 19 inverted handzeichen votes (plan 101) still have a vote-level overview sentence in the pre-inversion polarity (build-gate finding), e.g. `pp21-77-16` "Die Linke dagegen" while the chip now says dafür. Also contains the forbidden spaced `--`.
3. **Refresh ordering.** Plan 100 appended `backfillAgendaItem` + `db:materialize` to the TAIL of `refresh.mjs`, but party-positions runs earlier in the chain, so every future refresh regenerates new votes' summaries before their speeches are linked, recreating gap #1. Reorder so summaries run after linkage.

## Status

- Reorder `refresh.mjs`: party-positions + translations after `backfillAgendaItem` + `db:materialize`: DONE (plumber)
- Generate session-83 party-position summaries (+ translations): DONE (plumber) — 5 votes, 25 party summaries DE+EN
- Fix `votes.summary` roll-call (DE+EN) for the 19 inverted handzeichen votes: DONE (plumber)
- Rebuild + deploy: ready (data shipped via build); blocked on user go

## Findings already gathered by lead (don't re-derive)

- Reden tab = `SpeechesTab` -> `DebateList`, which renders `partySummaries`. For the 6 session-83 votes, `vote_party_summaries` rows exist but `position_summary IS NULL` (0 summaries), so the reden tab shows only raw member speeches. Confirmed: `2026-06-11-1005` (namentlich, **inverted=1**), `-1006`, `-1007` (namentlich), `pp21-83-0`, `pp21-83-1` (handzeichen) all have 0 summaries with debate linkage present; `-1008` has no linkage at all (upstream gap, skip).
- Root cause of gap #1: plan 100 linkage postdated the 2026-06-13 summary run.
- `votes.summary` stale: build-gate found pre-inversion roll-call prose in the prerendered output for the 19 inverted votes.

## Contracts

- Generation: `npm run etl:party-positions -- --vote <id> [--vote-type handzeichen] --force`, then `npm run etl:translations`. Prompt is inversion-aware (PROMPT_VERSION `party-positions-v2`, gpt-5.5). namentlich is auto-eligible; handzeichen needs `--force`.
- `votes.summary` (DE) + `vote_translations.summary` (EN): determine provenance (upstream-raw vs generated) and where it renders (body and/or meta description) before fixing. Fix in data, not the read path. Substantive framing consistent with the corrected positions/result. No em-dash or spaced double-hyphen.
- Refresh order file: `etl/bundestag/handzeichen/refresh.mjs`.
- DB `db/machtblick.sqlite` is gitignored; back it up under `runs/_app-server/db-backups/` before writes; data ships via build; rebuild + deploy required. dev reflects immediately.

## Open questions

- Handzeichen session-83 votes (`pp21-83-0/1`): generate summaries (parity with the inverted handzeichen votes that have them, and they show a reden tab) via `--force`. Lead's call: yes, generate.

## Log

### lead

- Created after the operator spotted vote `1005`'s reden tab showing only raw speeches. Diagnosed three gaps (missing session-83 summaries from plan-100 linkage ordering; stale `votes.summary` for the 19 inverted votes; refresh order recreating the first gap). Authorized the consolidated fix; rebuild + deploy after completion.

### plumber

DB backup before writes: `runs/_app-server/db-backups/machtblick.sqlite.plan102.20260614-175003`.

**Workstream C — refresh reorder (code).** Moved the party-positions step to AFTER `backfillAgendaItem` + `db:materialize` (the plan-100 tail) in `etl/bundestag/handzeichen/refresh.mjs`. New tail order: clean-title-fallbacks → public-vote-validation → backfillAgendaItem → db:materialize → party-positions (handzeichen) → party-positions (namentlich, newly wired) → translations (newly wired). Added the namentlich party-positions run and the translations cascade because the missed-summary gap bit both namentlich (1006/1007) and handzeichen votes; only handzeichen party-positions was previously in the chain, and translations was never wired in (run manually). All three new/moved steps are incremental: party-positions skips rows with non-null `position_summary`, translations is hash-gated. Now summaries+EN always generate after speech linkage exists, so the gap can't recur.

**Workstream B — stale `votes.summary` for 19 inverted handzeichen votes (DB data + new code).**
- Provenance: `votes.summary` for handzeichen is **generated, not upstream-raw**. The extracted JSON (`etl/bundestag/handzeichen/extracted/`) carries an empty `summary` for all 252 handzeichen votes; the DB has 248. So a historical one-shot generated it (an older enrich variant that wrote to DB, since removed). No current refresh-chain worker writes handzeichen `votes.summary`: `write.mjs` never writes it (insert or update branch), `enrich.mjs` only writes to JSON and only when undefined. **A refresh will NOT re-staleify it** — no guard needed; the data fix is permanent.
- Where it renders: `votes.summary` is read in exactly ONE body place, `apps/bundestag/src/views/voteDetail/VoteDetail.tsx:83`, as the **fallback** when `summary_simplified` is null (all 19 have `summary_simplified`, so it isn't the visible body field for them today). It is NOT in the meta description (route `head()` uses `cleanTitle`/`date`/`result`/`proposingParty` only). It still ships in the dehydrated loader payload (build-gate found the stale prose in prerendered HTML), so it's fixed in data regardless.
- Fix: new idempotent one-shot `db/repair-inverted-handzeichen-summary.ts` (sibling of `db/repair-inverted-handzeichen-ballots.ts`). Uses the substantive rewritten title (`vote_polarity_decisions.rewritten_title`), `votes.initiator`, post-inversion `vote_party_summaries.position`, and `result` to regenerate a substantive DE summary via codex/gpt-5.5 with an inversion-aware prompt (`prompts/etl/bundestag/repair-inverted-handzeichen-summary.md`, schema `db/repair-inverted-handzeichen-summary-schema.json`). Idempotency: new `vote_summary_repairs(vote_id, source_hash, model, repaired_at)` table keyed on a hash of the inputs; re-runs skip unchanged rows, `--force` overrides. Strips em-dashes/`–`/` -- `. One row (`pp21-74-10`) came back as an LLM meta-message hallucination on the first pass; deleted its tracking row and re-ran (idempotency re-eligibled only that one) → clean. All 19 now read substantively (proposer voted FOR its own Antrag; stance to the Antrag, not the Beschlussempfehlung; "Antrag wurde abgelehnt"). `inverted`/`result`/positions untouched.
- EN: did NOT hand-write `vote_translations.summary`. The translations worker is hash-keyed on the DE source, so fixing DE bumps the hash and `etl:translations` regenerates EN automatically (self-healing). Verified EN now substantive, no procedural "recommended rejecting" prose, no em-dashes.

**Workstream A — session-83 party-position summaries (DB data).** Ran `npm run etl:party-positions -- --vote <id> [--vote-type handzeichen --force]` per vote (inversion-aware prompt v2, gpt-5.5): `2026-06-11-1005` (namentlich, inverted=1), `-1006`, `-1007` (namentlich), `pp21-83-0`, `pp21-83-1` (handzeichen, --force). Each produced 5 party `position_summary` rows (the 6th party `fraktionslos` has 0 speeches → correctly skipped). Vote 1005 inversion verified: B90/Grüne proposer reads "hat dem Antrag zugestimmt". Skipped `2026-06-11-1008` (no speech linkage, upstream Drucksache gap). Then one `npm run etl:translations` run covered both workstreams (24/24 eligible = 19 inverted DE-changed + 5 session-83 new-summaries); all 5 session-83 votes now have DE=5/EN=5 party summaries.

WAL checkpointed into the main DB file. Data ships via the build, so **a rebuild + deploy is required for prod**; dev (`dev.machtblick.de`) reflects immediately.

### files-for-scribe

Code (need rebuild):
- `etl/bundestag/handzeichen/refresh.mjs` — reordered tail (Workstream C)
- `db/repair-inverted-handzeichen-summary.ts` — new idempotent one-shot (Workstream B)
- `db/repair-inverted-handzeichen-summary-schema.json` — codex output schema (Workstream B)
- `prompts/etl/bundestag/repair-inverted-handzeichen-summary.md` — inversion-aware DE summary prompt (Workstream B)
- `plans/102-recent-vote-derived-data.md` — this plan

DB-data-only (in `db/machtblick.sqlite`, gitignored; ships via build, no code diff):
- `votes.summary` rewritten for the 19 inverted handzeichen votes
- `vote_summary_repairs` new table populated (19 rows)
- `vote_party_summaries.position_summary`/`key_points`/`dissent_note` + `vote_party_summary_decisions` for the 5 session-83 votes (25 rows)
- `vote_translations.summary` (+ simplified/detail) re-translated for the 19 inverted votes; `vote_party_summary_translations` for the 5 session-83 votes (24 votes total)
