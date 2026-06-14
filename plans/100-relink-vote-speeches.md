# Relink vote speeches (session 83) and close refresh gaps

## Goal

Substantive votes from session 83 (2026-06-11) show no speeches tab on the site even though the speeches are in the DB. The site renders the tab only when a vote resolves to at least one linked speech through the `vote_debate_groups` bridge, and those bridge rows were never written for votes added after 2026-05-22. This traces to the 2026-06-13 refresh (plan 98), where term 21 namentliche votes were re-imported late after a term-default bug and the speech to vote linker was not part of the corrective rerun. Backfill the linkage so the tab reappears, confirm why the refresh dropped the step so the weekly auto-refresh does not repeat it, and close the stale Großspenden slice surfaced in the same investigation.

## Status

- Backfill `vote_debate_groups` for substantive votes since 2026-05-22: done (plumber) — 5/6 session-83 votes now link (45/67/67/17/17 speeches); session-80 substantive vote recovered too (17). The 6th (Jahresemissions-Verordnung) is an upstream protocol-extraction gap, correctly unlinkable.
- Root-cause why the 2026-06-13 refresh produced no bridge rows for these votes; document and prevent recurrence: done (plumber) — agenda-item backfill (the linkage prerequisite) is not in any refresh chain or npm script. Documented in plumber.md. Recurrence fix applied: `refresh.mjs` now chains the agenda backfill + `db:materialize` at its tail, and a discoverable `etl:votes:backfill-agenda` npm alias was added.
- Refresh party donations (Großspenden) through 2026-06-10: done (plumber) — 8 rows added (88 → 96), latest notified now 2026-06-10.
- Verify speeches tab on dev for session 83 votes: done (tester) — PASS. bafög 67, eufor-althea 17, entschliessungsantrag 45 (tabs present and populated with exact counts); 1008 Verordnung tab correctly absent; 2026-05-22 regression intact at 33. No console errors, no regressions.
- Commit data + docs + recurrence patch: blocked on explicit user go (scribe)
- Rebuild + redeploy so prod prerenders the tab: blocked on explicit user go (deployer)

## Contracts

- Read path is correct and must NOT change (fix data, not symptoms). The tab condition is `reden: data.debate.length > 0` in `apps/bundestag/src/views/voteDetail/VoteDetail.tsx`; speeches come from `loadDebateForVote()` in `apps/bundestag/src/server/votes.ts`, joining `vote_debate_groups` (vote_id -> group_id) -> `speech_debate_group_speeches` -> `speeches`.
- The fix materializes the missing `vote_debate_groups` (and any dependent `speech_debate_group_speeches`) rows via the existing ETL linker, scoped to the affected votes. No app-code workaround.
- Affected votes: the 6 substantive (`procedural=0`) session-83 votes dated 2026-06-11, plus any other `procedural=0` vote dated after 2026-05-22 that currently has zero `vote_debate_groups` rows. Baseline that works: the 2026-05-22 vote resolves to 33 linked speeches.
- DB: `db/machtblick.sqlite`. Back it up under `runs/_app-server/db-backups/` before the first write, per the house refresh pattern.
- Donations: scraper `etl/bundestag-spenden/ingest.ts`, table `party_donations`; we currently hold notifications through 2026-05-12, upstream lists through 2026-06-10. Publish the complete slice only.
- Prod shows the tab only after a rebuild bakes the linkage into prerendered vote pages, then a deploy. Data fix alone is invisible on machtblick.de until then.

## Open questions

- Is the linker a standalone npm script (e.g. `etl:speech-vote-join`) or folded into `db:materialize`? plumber to name the exact command run, so the auto-refresh plan can include it. (lead)
  - ANSWERED (plumber): The linker is folded into `db:materialize` (`tsx db/materialize-derived-data.ts`), functions `materializeSpeechDebateGroups` + `materializeSpeechVoteLinks` + `materializeVoteDebateGroups` (full DELETE+rebuild, idempotent, global not scoped). There is NO `etl:speech-vote-join` script. BUT `db:materialize` alone does not fix the gap: both its linkage paths require `votes.agenda_item`, which the namentliche/handzeichen ingest does not set. The real prerequisite is the standalone agenda-item backfill `npx tsx etl/bundestag/votes/backfillAgendaItem.ts` (no npm alias exists). The two commands that fix this, in order: `npx tsx etl/bundestag/votes/backfillAgendaItem.ts` then `npm run db:materialize`.
- Does plan 98's auto-refresh command list need the linker added to its standard derived sequence to prevent recurrence? (lead, after plumber root-causes)
  - ANSWERED (plumber): Yes. `etl/bundestag/handzeichen/refresh.mjs` chains 13 derived steps but neither `backfillAgendaItem.ts` nor `db:materialize`. Namentliche votes (`etl:votes:namentlich`) are a separate manual step that also runs neither. So every refresh since the agenda-item feature shipped has left new votes with `agenda_item = NULL` and therefore zero speech links. Recommended fix (app-code change, deferred to lead — I did not patch refresh.mjs without sign-off): append two steps to the tail of `refresh.mjs`, after `validate-public-votes.ts`:
    1. `npx tsx etl/bundestag/votes/backfillAgendaItem.ts`
    2. `npm run db:materialize` (or `npx tsx db/materialize-derived-data.ts`)
    Both are idempotent and safe to run unconditionally on every refresh. Optionally also add an `etl:votes:backfill-agenda` npm alias so the step is discoverable. If lead wants, plumber can make this one-line patch in a follow-up.

## Log

### lead

- Created plan after a read-only investigation: confirmed the speeches exist for session 83 (401 rows) but all 6 substantive votes resolve to 0 linked speeches via `vote_debate_groups`, while 2026-05-22 resolves to 33. Linkage boundary is sharp after 2026-05-22. Refuted the earlier DIP-stub hypothesis: groups (14), agenda items (16), and speeches (401) are all present for session 83; only the bridge rows are missing.
- Dispatched plumber to backfill the linkage, root-cause the skip, and close the donations slice. Tester and deployer to follow; deploy gated on explicit user go.
- Authorized the recurrence-prevention patch (in scope, idempotent, low-risk) and dispatched plumber to apply it to `refresh.mjs` + `package.json`. Confirmed applied.
- Tester verified the fix on local dev (PASS, exact counts). All workstreams complete; commit + deploy now gated on explicit user go. Note for a future cleanup: `apps/bundestag/test/.tester-*.spec.ts` is not in `.gitignore` (only hidden by the dot prefix); a stray tester spec could be committed accidentally.

### plumber

Done (no commit, no deploy — handed to scribe/tester/deployer).

**Backup:** `runs/_app-server/db-backups/machtblick-2026-06-14T14-06-50-pre-plan100.sqlite` (integrity ok) before any write.

**Root cause (one line):** the agenda-item backfill (`backfillAgendaItem.ts`), which is the prerequisite for the speech↔vote linkage, has no npm script and is in no refresh chain, so the 2026-06-13 refresh left all post-2026-05-22 votes with `agenda_item = NULL` and `db:materialize`'s two linkage paths (both keyed on `votes.agenda_item`) produced zero bridge rows.

**What I ran (data only, idempotent):**
1. `npx tsx etl/bundestag/votes/backfillAgendaItem.ts` — resolved 293/309 WP21 votes; set `agenda_item` on 5 of the 6 session-83 votes + the session-80 substantive vote that had silently fallen in the same gap.
2. `npm run db:materialize` — rebuilt `speech_debate_groups`/`speech_vote_links`/`vote_debate_groups`. `vote_debate_groups`: 207 → 213.
3. `npm run etl:donations` — `party_donations` 88 → 96 (+8), latest notified 2026-05-12 → 2026-06-10.

**Per-vote linked-speech counts, before → after (production join `vote_debate_groups → speech_debate_group_speeches → speeches`):**

| Vote | before | after |
|---|---|---|
| pp21-83-0-entschliessungsantrag-aussen-und-friedenspolitik | 0 | 45 |
| pp21-83-1-bafog-starken-und-studienstarthilfe | 0 | 67 |
| 2026-06-11-1005-ablehnung-antrag-bafog-reform | 0 | 67 |
| 2026-06-11-1006-bundeswehreinsatz-bosnien-eufor-althea | 0 | 17 |
| 2026-06-11-1007-bundeswehreinsatz-kosovo-kfor | 0 | 17 |
| 2026-06-11-1008-jahresemissions-gesamtmengen-verordnung | 0 | 0 (upstream gap) |

The 1008 Verordnung stays 0: its Drucksachen (21/6124, 21/5069) appear 0× in the published 21083.xml and "Jahresemission" is absent from the protocol text. Nothing to match on — same class as the 31 NULL-document handzeichen rows. Not a fix failure; needs upstream extraction to capture the TOP first.

**Regression check:** 2026-05-22 baseline still 33 linked speeches; older dates unchanged; procedural votes (e.g. pp21-80-0 Wahlprüfungsausschuss) correctly remain 0. `db:validate:votes` ran inside materialize-adjacent flow without error.

**Prod note:** the data fix is invisible on machtblick.de until a rebuild bakes the linkage into the prerendered vote pages (server fns run at build time on Cloudflare Pages with `spa: false`). An app rebuild + deploy is required for the tab to appear in prod; dev (`vite dev`) reflects it immediately.

**Recurrence fix (applied, signed off):** appended two idempotent steps to the tail of `etl/bundestag/handzeichen/refresh.mjs`, after the `validate-public-votes.ts` step, matching the file's existing `await run('npx', ['tsx', join(HERE, ...)])` style:
1. `→ backfill agenda_item from plenarprotokoll XML` → `backfillAgendaItem.ts`
2. `→ materialize derived data (speech↔vote linkage)` → `db/materialize-derived-data.ts`
Also added npm alias `etl:votes:backfill-agenda` → `tsx etl/bundestag/votes/backfillAgendaItem.ts` next to the other `etl:votes:*` scripts. Not run (steps were validated manually earlier this session); no full refresh executed.

**Files for scribe (no commit yet — lead to sequence):**
- `plans/100-relink-vote-speeches.md` (this plan)
- `.claude/agents/plumber.md` (new linkage quirk subsection)
- `etl/bundestag/handzeichen/refresh.mjs` (recurrence fix: two appended steps)
- `package.json` (new `etl:votes:backfill-agenda` alias)
- `db/machtblick.sqlite` (data: agenda_item backfill, rebuilt `vote_debate_groups`, +8 donations) — commit per house policy on the DB artifact
