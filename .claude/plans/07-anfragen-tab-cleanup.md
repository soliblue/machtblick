# 07 — Anfragen tab cleanup

## Goal

Bring the member-detail Anfragen tab in line with the visual pattern of `VotingRecordTab` and `MemberSpeechesSection`: filter row → column header row → flat list of rows. The current tab has a heavy summary card (type breakdown + progress bar + total) and a "Gruppiert nach Thema/Datum" toggle that the other tabs don't have. Both go away.

## Status

| Workstream | Owner | State |
|---|---|---|
| Strip summary + toggle, flatten, add header row | frontend | todo |

## Contracts

- Touch only `apps/bundestag/src/views/memberDetail/`. Server (`@/server/anfragen`) and hooks unchanged. `MemberAnfragen.flat` is the only data shape needed; `groups`, `byType`, `total` go unused by the view (leave the server contract alone — other consumers may need it).
- Reference layout: `apps/bundestag/src/views/memberDetail/VotingRecordTab.tsx`. Match its grid: `grid-cols-[1fr_auto_auto_auto]`, uppercase opacity-l header row with `letterSpacing: '0.08em'`, border-top per row.
- Row component: `AnfrageRow.tsx`. May need its grid template updated to match the new column layout so the header row aligns cleanly above it.

## Design decisions (from lead)

- **Strip** `AnfragenSummary` (delete the file) and the `GroupToggle` helper inside `AnfragenTab.tsx`.
- **Strip** Sachgebiet group headers — flat list ordered by `data.flat` (already date-sorted from server).
- **Keep** the existing filter row: Typ, Status, Ressort pills + search input. Same `Filter` icon prefix as `VotingRecordTab`.
- **Add** a column header row matching `VotingRecordTab`'s style. Columns: `Anfrage` (1fr), `Datum` (w-24), `Typ` (w-16), `Status` (w-24).
- Empty state ("Keine Anfragen in WP21") stays.
- No changes to the route, the hook, or the server function.

## Open questions

None — lead has decided.

## Log

- 2026-05-12 — lead: plan created. Dispatching frontend.
- 2026-05-12 — frontend: stripped `AnfragenSummary` (file deleted), the `GroupToggle` helper, the `groupBy` state, and Sachgebiet group rendering from `AnfragenTab.tsx`. Filter row + search kept verbatim. Added a `grid-cols-[1fr_auto_auto_auto]` header row matching `VotingRecordTab` (Anfrage / Datum w-24 / Typ w-16 / Status w-24, uppercase opacity-l, letter-spacing 0.08em). Refactored `AnfrageRow.tsx` to the same grid: title+meta in the first cell, then date, type pill, and a new Status cell rendering `Beantwortet`/`Offen` in success/danger. Meta line dropped the now-redundant inline status. Updated `anfragenTab.mock.md` to the new flat layout. Server type and hook untouched. `npx tsc -p apps/bundestag/tsconfig.json --noEmit` reports zero errors in changed files; one pre-existing unrelated error in `server/parties.ts` (`cohesion: number | null` vs `PartyVoteRow.cohesion: number`) remains.
