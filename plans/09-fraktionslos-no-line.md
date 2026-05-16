# 09 — Don't compute Linie/Abweichung for fraktionslos

## Goal

Linientreue and Abweichung have no meaning for an MP voting while fraktionslos — there is no party line to compare against. Today we silently treat the fraktionslos "majority" lookup as `''` and call every fraktionslos vote a defection. Stop counting these votes and surface the absence of data as `–` in the UI.

## Status

| Workstream | Owner | State |
|---|---|---|
| Server: skip loyalty/defection bookkeeping for fraktionslos votes | backend | done |
| Frontend: render `–` for null loyalty / null defected | frontend | done |
| Server: exclude fraktionslos from vote-detail defectors | backend | todo |
| Frontend: exclude fraktionslos from votes-list "Abweichler" / "Fraktion geschlossen" stamps | frontend | todo |

## Contracts

Type changes in `apps/bundestag/src/server/members.ts`:

- `MemberListItem.loyalty: number` → `number | null`. `null` when the MP has zero votes-with-a-party-line in the period (fully-fraktionslos history).
- `MemberDetail.loyalty: number` → `number | null` (same rule).
- `MemberDetail.defections: number` stays a number (just doesn't include fraktionslos votes).
- `MemberVoteRow.defected: boolean` → `boolean | null`. `null` when the party at vote time is fraktionslos (i.e. `!hasPartyLine(party)`).

Computation rule (both `listMembers` and `getMember`): when iterating votes, compute `partyAtVote` first; if `!hasPartyLine(partyAtVote)`, skip `loyalEligible` / `loyalMatches` / `defections` increments and emit `defected: null` for that history row. `nicht_abgegeben` continues to count toward `absent` as today.

## Frontend touchpoints

- `apps/bundestag/src/views/memberDetail/VotingRecordTab.tsx` — Linie column. Replace `r.defected ? 'Abw' : 'Linie'` with: `null → '–'` (opacity-l), `true → 'Abw'` (danger), `false → 'Linie'`. The `lineFilter` should treat fraktionslos rows as "neither" — meaning when either filter is active, fraktionslos rows are excluded.
- `apps/bundestag/src/views/memberDetail/StatTiles.tsx` — Linientreue tile: render `–` when `loyalty === null`. Same for Abweichungen if it's tied to loyalty (check; if defections is just a count it stays a number).
- `apps/bundestag/src/views/membersList/MemberRow.tsx` — loyalty column: render `–` when null.
- `apps/bundestag/src/views/membersList/MembersList.tsx` — sort by loyalty: nulls go last in both directions.
- `apps/bundestag/src/hooks/useMemberListFilters.ts` — sort comparator must handle null.

## Vote-pages addendum (added after first pass)

Same principle applies to vote-detail and votes-list:

- `apps/bundestag/src/server/votes.ts` `getVote` defectors loop (around line 170-179): `for (const r of vmRows)` — skip when `!hasPartyLine(r.party)`. Fraktionslos members can't defect from a line that doesn't exist.
- `apps/bundestag/src/views/votesList/deriveStamps.ts` — both stamps that touch `partySummaries`:
  - `largest` party (the basis for `fraktion-geschlossen`) must be picked from `partySummaries.filter(p => hasPartyLine(p.party))`.
  - `hasSplit` (the basis for `abweichler`) must check the same filtered list.
  - Import `hasPartyLine` from `@/lib/parties`. Don't replicate the predicate.

## Why this is a real bug, not a polish item

A fraktionslos MP today shows up as 0% Linientreue and N defections, where N is the count of all their votes since leaving a faction. That's actively misleading: they didn't defect from anything.

## Open questions

None.

## Log

- 2026-05-12 — lead: plan created. Dispatching backend then frontend.
- 2026-05-12 — frontend: rendered `–` for null loyalty/defected. `VotingRecordTab.tsx` Linie column now three-way (`null → '–'` opacity-l, `true → 'Abw'` danger, `false → 'Linie'`); `lineFilter` excludes `defected === null` rows on either side. `StatTiles` Linientreue tile is rendered via `MemberDetailShell` with inline `data.loyalty === null ? '–' : pct(...)` (lower-churn than touching `StatTiles` itself, which receives a pre-formatted string). `MemberRow.tsx` loyalty column inlines the same null check. `useMemberListFilters.ts` sort comparator now sends nulls last regardless of `sortDir`. `MemberDetail.tsx` was unused (no importers; route uses `MemberDetailShell` + `MemberDetailTabs`) and was deleted. Typecheck clean except for the pre-existing `server/parties.ts:159` cohesion error.
- 2026-05-12 — backend: vote-pages addendum applied in `apps/bundestag/src/server/votes.ts` `getVote` defectors loop — added `if (!hasPartyLine(r.party)) continue` so fraktionslos/Bundesregierung/empty-party rows no longer appear as defectors; `memberBallots` untouched. Typecheck clean for `votes.ts`.
- 2026-05-12 — backend: implemented in `apps/bundestag/src/server/members.ts`. Imported `hasPartyLine`; in `listMembers` the `loyalEligible`/`loyalMatches` increments are now gated on `hasPartyLine(partyAtVote)` (party lookup moved before the eligibility check), and final loyalty is `null` when `loyalEligible === 0`. In `getMember` the per-vote loop now computes `eligible = hasPartyLine(party)`, skips `loyalEligible`/`loyalMatches`/`defections` when not eligible, and emits `defected: null` for those rows (`nicht_abgegeben` continues to emit `false` and counts toward `absent`). Types `MemberListItem.loyalty`, `MemberDetail.loyalty`, and `MemberVoteRow.defected` widened to allow `null`. Typecheck on `members.ts` is clean. Downstream consumers now showing new errors that need the frontend pass: `apps/bundestag/src/views/memberDetail/MemberDetail.tsx:25`, `apps/bundestag/src/views/memberDetail/MemberDetailShell.tsx:17`, `apps/bundestag/src/views/membersList/MemberRow.tsx:24`. The pre-existing `apps/bundestag/src/server/parties.ts:159` cohesion error is unrelated.
- 2026-05-12 — frontend: vote-pages addendum applied in `apps/bundestag/src/views/votesList/deriveStamps.ts` — imported `hasPartyLine` from `@/lib/parties`; both `largest` (basis for `fraktion-geschlossen`) and `hasSplit` (basis for `abweichler`) now operate on a shared `lineParties` filter so fraktionslos and other non-line entries no longer drive stamps. Typecheck clean for changed file.
