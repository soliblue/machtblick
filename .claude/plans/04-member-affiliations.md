# 04 — Member Affiliations (time-ranged party)

## Goal

Replace the denormalized `vote_members.party` as the source of truth for "what party is this member in" with a proper time-ranged `member_affiliations(member_id, party, valid_from, valid_to)` table. Read paths join on vote date.

Motivation: Bundestag's per-vote `bt-person-fraktion` tag drifts (e.g. Jan Wenzel Schmidt flips AfD → fraktionslos in March 2026 plenary votes while handzeichen drucksachen still call him AfD). Today the app surfaces whatever the most-recent `vote_members.party` row says, which is unstable and not time-correct.

## Status

| Workstream | State |
|---|---|
| Schema + migration | done |
| ETL: populate from abgeordnetenwatch mandates | done (used as boundary refinement only — see log) |
| ETL: backfill from existing `vote_members` for gaps | done (primary signal — see log) |
| Backend: read path joins on vote date | todo |
| Frontend: no change expected (party still arrives via server types) | todo |
| Documentation (plumber.md quirks) | done |

## Contracts

**New table** (Drizzle, `db/schema/memberAffiliations.ts`):
- `member_id` (FK members)
- `party` (text — same vocabulary as `lib/parties.ts`)
- `valid_from` (date, inclusive)
- `valid_to` (date, nullable — null = current)
- Unique on `(member_id, valid_from)`; partial index for `valid_to is null`

**Source of truth priority** (plumber decides per implementation):
1. abgeordnetenwatch mandate periods (authoritative, has fraktion changes)
2. Fallback: derive runs from `vote_members.party` history if AW lacks the member

**Read API**: backend exports `getMemberPartyAt(memberId, date)` and joins it into member/vote queries. `vote_members.party` becomes raw archival data, not read by the app.

## Open questions

- Should we keep `vote_members.party` or drop the column? Plumber proposal: keep as `raw_party` for audit.
- abgeordnetenwatch granularity: do mandate periods include fraktion changes mid-mandate, or only fraktion at start? Plumber to verify.
- UI: party stat tile shows current party — derive as "affiliation where `valid_to is null`" per member.

## Log

- 2026-05-12 lead: Plan created after Schmidt, Jan Wenzel investigation. Root cause is upstream-truth drift in Bundestag per-vote XML, not an ETL bug. User chose to build the proper time-ranged table rather than patch.
- 2026-05-12 plumber: Implemented schema + ETL.
  - Schema: `db/schema/memberAffiliations.ts`, migration `0004_mean_punisher.sql`. Columns `(id, member_id, party, valid_from, valid_to)`, unique `(member_id, valid_from)`, index on `(member_id, valid_to)` for current-row lookup. Exported types `MemberAffiliation` / `NewMemberAffiliation` from `db/schema/index.ts` for backend.
  - Open question — AW granularity: AW's `fraction_membership` only stores the **latest** change per mandate, not history. Schmidt's mandate only carries the fraktionslos entry; the prior AfD period is implicit and would be lost if we trusted AW alone. So AW alone is **not** sufficient. Decision: `vote_members.party` is the primary signal (full run history per member), AW provides boundary-precision and Nachrücker entry dates.
  - ETL `etl/bundestag-affiliations/` (`npm run etl:affiliations`):
    1. fetches AW mandates for parliament_period=161 + parliament-period start date (2025-03-25)
    2. collapses `vote_members.party` into per-member runs ordered by vote date
    3. emits one affiliation row per run. First-run `valid_from` defaults to parliament-period start, overridden by AW for Nachrücker. Between-run boundary defaults to day-before-next-run, overridden by AW when AW's flip target matches the next run's party.
    4. ingest deletes and rewrites the table — idempotent.
  - `vote_members.party` kept as raw archival data (open question resolved per plumber proposal). Documented in `.claude/agents/plumber.md` under "Per-vote party tags drift".
  - Result: 638 rows / 637 members. Schmidt → AfD `[2025-03-25, 2026-03-03]`, fraktionslos `[2026-03-04, null]`. Knodel correctly enters as fraktionslos at 2025-05-06.
- 2026-05-12 plumber: Left for backend:
  - Implement `getMemberPartyAt(memberId, date)` reading `member_affiliations` where `valid_from <= date AND (valid_to IS NULL OR valid_to >= date)`.
  - Implement `getCurrentParty(memberId)` reading the row where `valid_to IS NULL` (use the `member_affiliations_current_idx` index).
  - Replace any reads of `vote_members.party` in member/vote join queries with a join on `member_affiliations` on `vote.date`.
  - Frontend should see no shape change — server types still expose `party: string`.
  - Note for backend: `vote_party_summaries` is unaffected (it's per-fraktion-as-it-voted, which is the correct semantic for vote-result charts). Only per-member party lookups need to switch.
- 2026-05-12 plumber: Two data fixes after duplicate / dropout investigation.
  - Merged `kempf-martina-rose-marie` → `kempf-martina` (same AfD/BW member; upstream split the ID via middle names). 2 `vote_members` rows reassigned, 1 affiliation row + 1 member row deleted. `kempf-martina` now has 51 vote_members rows; the duplicate is gone everywhere. One-shot: `db/merge-kempf.ts`, idempotent (re-runs as no-op).
  - Patched `etl/bundestag/votes/transform/memberId.mjs` so future ingests can't re-fork the same person on middle names: slug now uses `slug("<last>-<first-token>")` where first-token is the first whitespace-delimited token of the first-name field. Hyphenated first names (`Hans-Peter`) stay intact. State-suffix collision rule unchanged. SOURCE.md + plumber.md updated.
  - Closed `foullong-uwe` affiliation: open `valid_to` set to `2025-07-10` (last roll-call appearance; treated as resignation). One affiliation row, no schema change. One-shot: `db/close-foullong.ts`. Backend's "current MdB = `valid_to IS NULL`" derivation now correctly excludes him.
- 2026-05-12 backend: Wired `member_affiliations` into the read path. Frontend types unchanged.
  - New helper `apps/bundestag/src/server/memberParty.ts` exporting `getMemberPartyAt`, `getCurrentParty`, `getCurrentPartyMap`, `loadAffiliationsByMember`, and `partyAt(list, date)` for batched in-memory lookups.
  - `members.ts`: `listMembers` now sources each member's `party` from `getCurrentPartyMap`; the per-vote loyalty match now joins the member's affiliation-at-vote-date against `vote_party_summaries`, instead of trusting `vote_members.party`. `getMember` sets the top-level `party` to current affiliation (`valid_to IS NULL`) and stamps each `MemberVoteRow.party` via `partyAt(affList, vote.date)`.
  - `parties.ts`: `getParty` member list is now built from `members` filtered by current affiliation == party (state still pulled from the latest `vote_members` row per member). `listParties` was already summary-only — no change. `vote_party_summaries` reads left intact per plumber's note.
  - `votes.ts`: `getVote` member ballots (and downstream defectors) now derive `party` from `partyAt(affByMember.get(memberId), vote.date)` rather than `vote_members.party`.
  - `proposingParty.ts`: no member-party reads, untouched.
  - Verified for Schmidt, Jan Wenzel: current party = `fraktionslos`; vote on 2026-02-27 resolves to `AfD`, vote on 2026-03-05 resolves to `fraktionslos`; earliest 2025 votes resolve to `AfD`; latest 2026-05-08 vote resolves to `fraktionslos`. Boundary matches the `[..., 2026-03-03]` / `[2026-03-04, null]` split.
  - Exported types (`MemberListItem`, `MemberDetail`, `MemberVoteRow`, `PartyMemberRow`, `VoteDetail.memberBallots`) all keep `party: string` — frontend contract unchanged.
