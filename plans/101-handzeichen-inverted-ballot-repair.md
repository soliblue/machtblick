# Repair inverted handzeichen votes (ballots left un-flipped)

## Goal

Every inverted handzeichen vote (19 of them, `procedural=0`) displays contradictory data: `votes.result` and `votes.inverted=1` reflect the polarity inversion, but `vote_party_summaries.position` shows the raw, un-inverted orientation, so the proposing faction appears to vote against its own motion (e.g. `pp21-77-16`: Die Linke stored `no` on its own athletes motion, result `abgelehnt`, inverted `1`). Fix the data so positions and result agree with the inversion, and fix the root cause so refreshes stop re-breaking them.

## Root cause

A re-ingest race:
1. Polarity (`self-no-escalate.mjs` -> `apply.mjs::applyInversion`) correctly flipped both `result` and `vote_party_summaries.position` and set `inverted=1` (2026-05-13).
2. `etl/bundestag/handzeichen/write.mjs` later re-ran (plan 97 result-repair, plan 98 refresh). Its exists-branch overwrites `votes.result` from raw `v.outcome` (~line 60) and re-derives `position` from raw `v.ja`/`v.nein` (~line 71), but never clears `inverted`. This reverted positions to raw and left `inverted=1` orphaned.
3. The polarity re-run is gated `WHERE v.inverted = 0`, so these rows are skipped forever; the flip is never re-applied.
4. `db:normalize` (proposer-voted-no) independently re-flips `result` for 18/19, masking half the damage. `pp21-40-19` slipped through and is fully wrong (still `angenommen`).

Namentlich inverted votes are unaffected: their ballots come from the XLSX path, which `write.mjs` skips (`if (v.vote_type === 'namentlich') continue`).

## Status

- Durable guard: stop `write.mjs` clobbering `result`/`position` on `inverted=1` rows: done (plumber)
- One-shot repair of the 19 stranded rows (re-flip positions, recompute result): done (plumber) — all 19 now proposer `position=yes`, result `abgelehnt`; 4 corrected `angenommen → abgelehnt`.
- Check whether derived/generated text (party-position summaries, translations) for the affected votes is stale, esp. `pp21-40-19` whose result flips: done (plumber) — FOUND STALE: `vote_party_summaries.position_summary`/`key_points` for 16 of the 19 (77 faction-summaries, not 42 as first estimated) assert pre-inversion stance and now contradict the corrected `position`. Resolved by inversion-aware regeneration (see verify log).
- Verify data (all 19 proposers consistent with `inverted=1`; `pp21-40-19` -> `abgelehnt`): done (plumber)
- Regenerate stale party-position summaries (inversion-aware) + cascade translations: done (plumber verify) — 77/77 German faction-summaries regenerated at PROMPT_VERSION `party-positions-v2` (gpt-5.5); 77/77 English translations self-healed via hash; both contradiction scans clean. The "42 faction-summaries" estimate in the diagnosis was low; the real affected count is 77 across the 16 votes.
- Verify on dev (`pp21-77-16`, `pp21-40-19` render correctly): todo (tester)
- Commit + deploy: blocked on explicit user go

## Contracts

- Tables: `votes` (`result`, `inverted`, `procedural`, initiator), `vote_party_summaries` (`position` per faction: yes/no/abstain), `vote_polarity_decisions` (`inverted`, `source`, `confidence`, `reason`).
- Durable fix file: `etl/bundestag/handzeichen/write.mjs` exists-branch. For `inverted=1` rows, do not overwrite `result` or re-derive `position` from raw (the inversion is meant to override raw). plumber picks the cleanest approach (skip those writes for inverted rows, or re-key polarity off a raw snapshot) and documents the choice.
- Recompute path for the repair: `apply.mjs::substantiveResultFromSummaries` (seat-weighted handzeichen path), `applyInversion` for the yes<->no flip.
- One-shot repair script: idempotent, checked in under `db/`, referenced from this plan.
- Affected set (resolve full 19 by signature `inverted=1 AND procedural=0 AND proposer position='no'`). Examples: `pp21-77-16`, `pp21-21-3`, `pp21-37-2`, `pp21-37-3`, `pp21-37-7`, `pp21-37-23`, `pp21-40-19` (doubly-wrong), `pp21-53-1`, `pp21-53-2`, `pp21-53-3`, `pp21-53-4`, `pp21-62-2`, `pp21-64-0`.
- DB `db/machtblick.sqlite` is gitignored; data reaches prod via the build. Back up under `runs/_app-server/db-backups/` before writes. Prod needs a rebuild+deploy to show the corrected pages. Do not change the read path.

## Open questions

- Durable guard approach (skip writes for inverted rows vs raw-snapshot re-key): plumber's call; record the choice and why in the log.

## Log

### lead

- Created after plumber's read-only diagnosis confirmed a class of 19 inverted handzeichen votes with raw ballots. Verified against the official Bundestag source for `pp21-77-16` (Beschlussempfehlung to reject Die Linke's athletes motion; substantively rejected, proposer should read `yes`). Authorized the two-part fix (durable writer guard + one-shot repair). Commit/deploy gated on explicit user go.

### plumber

Done (data + ETL guard). No commit, no deploy. Backup `runs/_app-server/db-backups/machtblick-2026-06-14T15-17-44-pre-plan101.sqlite` (integrity ok) before any write.

**Durable guard (chosen approach + why):** patched `etl/bundestag/handzeichen/write.mjs` exists-branch to **skip both** the `result` overwrite and the entire `vote_party_summaries` re-derivation when the existing row has `inverted = 1`. Implementation: extended the existence probe to `SELECT { id, inverted }`; the `votes` UPDATE now spreads `result` conditionally (`...(exists.inverted ? {} : { result })`) and the summaries block early-returns on `exists.inverted`. Title/document/date/source/fetchedAt still update (harmless metadata refresh). I chose skip-on-inverted over a raw-snapshot re-key because it is the minimal, self-evident invariant ("once polarity owns a row's polarity, the raw writer must not touch its substantive `result`/`position`") and needs no new table or replay plumbing. Also dedup'd the duplicated `isPetitionBundle` regex into one local while there (no behavior change). Side edit: exported `substantiveResultFromSummaries` from `etl/bundestag/polarity/apply.mjs` (was module-local) so the repair can reuse the seat-weighted handzeichen recompute.

**One-shot repair:** `db/repair-inverted-handzeichen-ballots.ts` (idempotent). Enumerates the affected set by signature `inverted=1 AND procedural=0 AND vote_type='handzeichen' AND proposer position='no'` (19 rows), flips every faction `position` yes↔no (abstain untouched), recomputes `votes.result` via `substantiveResultFromSummaries`. Idempotent because after the flip the proposer's `position` becomes `yes`, so rows drop out of the signature on re-run (verified: second run repaired 0). Run output: 19 repaired, of which 4 corrected `angenommen → abgelehnt` (`pp21-40-19`, `pp21-68-16/17/18` — the ones `db:normalize` had missed), 15 already had correct `abgelehnt`.

**Before/after sample:**
| Vote | before | after |
|---|---|---|
| `pp21-77-16` | result `abgelehnt`, Die Linke `no`, CDU/CSU `yes`, SPD `yes` | result `abgelehnt`, Die Linke `yes`, CDU/CSU `no`, SPD `no` |
| `pp21-40-19` | result `angenommen`, AfD `no`, others `yes` | result `abgelehnt`, AfD `yes`, others `no` |

Final coherence: all 19 now read proposer `position=yes` + result `abgelehnt`; zero rows match the broken signature.

**Stale derived text (deferred follow-up — NOT done in this change):** the LLM-generated `vote_party_summaries.position_summary` + `key_points` for **16 of the 19** votes (42 faction-summaries) were produced from the pre-inversion `result`/`position` and open with outcome assertions ("Die AfD hat die Vorlage abgelehnt", "Die CDU/CSU hat der Vorlage zugestimmt", …). After the position flip many now contradict the corrected `position` — e.g. `pp21-40-19` AfD summary still says "abgelehnt" while AfD now displays `yes`; CDU/CSU says "zugestimmt" while it now displays `no`. The text also inconsistently frames stance toward "die Vorlage" (procedural Beschlussempfehlung) vs "den Antrag" (substantive motion), so it cannot be mechanically corrected.
- `votes.summary_simplified`/`summary_detail` are NOT stale (pure Antrag-content from the Antrag PDF, no outcome language).
- Fix path when prioritized: `npm run etl:party-positions -- --vote <id> --vote-type handzeichen --force` per affected vote (the worker now reads corrected `vote.result`/`vote.position`), THEN `npm run etl:translations` (hash-keyed; English `vote_party_summary_translations` self-detect staleness once German changes). Caveat: `prompts/etl/bundestag/party-positions.md` is NOT inversion-aware — a naive `--force` rerun risks reproducing the procedural/substantive confusion. The prompt should first be taught that for an inverted vote, a faction's stored `yes` = support for the underlying Antrag (not the Beschlussempfehlung). Bump `PROMPT_VERSION` in `etl/bundestag/party-positions/prompt.mjs` when that lands. Affected votes (16): all of the 19 except `pp21-21-3`, `pp21-37-23`... (resolve live: `SELECT DISTINCT vote_id FROM vote_party_summaries s JOIN votes v ON v.id=s.vote_id WHERE v.inverted=1 AND v.procedural=0 AND v.vote_type='handzeichen' AND s.position_summary IS NOT NULL`).

**Prod note:** data fix is invisible on machtblick.de until a rebuild bakes the corrected `result`/`position` into the prerendered vote pages, then a deploy. A rebuild + deploy is required. dev (`vite dev`) reflects it immediately. The stale position-summary text will still render until the follow-up regeneration runs.

**Files for scribe (no commit yet):**
- `plans/101-handzeichen-inverted-ballot-repair.md` (this plan)
- `etl/bundestag/handzeichen/write.mjs` (durable guard)
- `etl/bundestag/polarity/apply.mjs` (export `substantiveResultFromSummaries`)
- `db/repair-inverted-handzeichen-ballots.ts` (new one-shot repair)
- `etl/bundestag/party-positions/prompt.mjs` (inversion-aware `hinweis_abstimmungsform` + `PROMPT_VERSION` `v1`→`v2`)
- `etl/bundestag/party-positions/run.mjs` (model default `gpt-5.2`→`gpt-5.5`; pass `v.inverted` to prompt)
- `prompts/etl/bundestag/party-positions.md` (follow `hinweis_abstimmungsform`; never contradict `abstimmungsverhalten`)
- `etl/bundestag/translations/run.mjs`, `etl/bundestag/antrag-descriptions/run.mjs`, `etl/bundestag/antrag-description-translations/run.mjs`, `etl/bundestag/speech-translations/run.mjs` (model default `gpt-5.2`→`gpt-5.5` across the LLM ETL workers; `translations/run.mjs` is the one the cascade ran on)
- `.claude/agents/plumber.md` (recurrence quirk under polarity notes)
- `db/machtblick.sqlite` (data: 19 votes re-flipped + result recomputed; 77 DE party-summaries regenerated at v2 + 77 EN translations refreshed) — commit per house policy on the DB artifact

### plumber (verify)

Picked up the durable background regen the prior plumber launched and drove it (plus the missing translation cascade) to completion from the DB rather than waiting on a notification. Final state:

**Regen complete: 77/77 German faction-summaries** across all 16 affected votes (`inverted=1 AND procedural=0 AND vote_type='handzeichen' AND position_summary IS NOT NULL`) now at `PROMPT_VERSION='party-positions-v2'`, model **gpt-5.5** (confirmed in the live `codex exec --model gpt-5.5` process and in every `vote_party_summary_decisions` row). The affected count is **77, not the 42 estimated** in the diagnosis. The background wrapper `/tmp/regen_remaining.sh` (pid 692478) handled the last 11 votes via `etl:party-positions --vote <id> --vote-type handzeichen --force`; it exited cleanly (`ALL_REMAINING_DONE`). Note: `--force` is what re-did already-summarized rows; the `PROMPT_VERSION` bump alone does not gate party-positions reruns (run.mjs uses `force || !row.position_summary`).

**Code changes confirmed in place:**
- `prompt.mjs`: `PROMPT_VERSION` bumped `party-positions-v1`→`party-positions-v2`; injects `hinweis_abstimmungsform` only when `vote.inverted` is truthy (empty spread otherwise → safe for non-inverted votes).
- `run.mjs`: model default `gpt-5.2`→`gpt-5.5`; added `v.inverted` to the candidate SELECT so it reaches `buildPrompt`.
- `prompts/etl/bundestag/party-positions.md`: now (a) "Nutze dafür genau das Feld partei.abstimmungsverhalten und widersprich ihm nie", (b) conditional "Wenn das Feld abstimmung.hinweis_abstimmungsform vorhanden ist, folge ihm" — describe stance toward the Antrag, not the Beschlussempfehlung. The condition makes it a no-op for non-inverted votes (the field is absent there).

**Translations cascaded (was NOT done by prior plumber):** all 77 EN `vote_party_summary_translations` were still `translation-en-v1`/gpt-5.2 from May 25-30. Ran `npm run etl:translations` (no `--force`): the global dry-run reported exactly `16/16 eligible` — the hash-keyed staleness detector flagged precisely the 16 changed votes and nothing else, proving the self-heal works as designed. After the run: **77/77 EN refreshed today** (gpt-5.5), and a fresh global dry-run reports `translation jobs: 0/0` (idempotent, settled).

**Text now agrees with corrected positions (verification snippets):**
- `pp21-40-19` AfD (position now `yes`): DE "Die AfD hat dem Antrag zugestimmt." / EN "The AfD voted in favor of the motion." (was "abgelehnt" pre-inversion).
- `pp21-77-16` Die Linke (position now `yes`): DE "Die Linke hat dem Antrag zugestimmt." / EN "Die Linke voted for the motion."
- Contradiction heuristic scans (yes-faction text asserting "abgelehnt"/"voted against", no-faction asserting "zugestimmt"/"voted for") return **zero rows** for both DE and EN across all 16 votes. Em-dash/en-dash scan: 0.

**Rebuild required for prod:** yes. The corrected `result`/`position` AND the regenerated DE+EN summary text are all in `db/machtblick.sqlite`, which only reaches machtblick.de via a fresh build that bakes the data into the prerendered vote pages, then a deploy. dev (`vite dev`) reflects it immediately. No commit, no deploy done (gated on user go).
