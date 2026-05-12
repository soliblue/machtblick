# 08 — Search input on Abgeordnete and Abstimmungen lists

## Goal

Match the search affordance already present on Reden / Anfragen tabs: a small search input next to the filter pills on the members list (`/members`) and votes list (`/votes`). URL-synced via `?q=` so the search survives navigation and is shareable.

## Status

| Workstream | Owner | State |
|---|---|---|
| Add `q` search param + filter to members list | frontend | todo |
| Add `q` search param + filter to votes list | frontend | todo |

## Contracts

- Reuse the exact input styling from `apps/bundestag/src/views/memberDetail/MemberSpeechesSection.tsx`: `Search` icon from lucide, `border bg-transparent py-xs pl-[1.75rem] pr-s text-m outline-none focus:border-fg`, border color `color-mix(in oklab, var(--color-fg) 15%, transparent)`. No new component, inline the input twice.
- Members: filter `MemberListItem.name` case-insensitively.
- Votes: filter `VoteListItem.title` case-insensitively.
- Search lives in the URL as `q=...`. Empty / whitespace = no filter (param omitted).
- Filter happens in the existing hooks (`useMemberListFilters`, `useVoteListFilters`) — they already accept the other filters; just thread `query` through.

## Design decisions (from lead)

- Input goes in the same flex row as the filter pills, on the right side. Members list already has a `flex justify-between` row with pills on the left and the count badge on the right — put the search before the count.
- Votes list has a single horizontal-scroll filter row. Pull the row out of `overflow-x-auto` for the search to sit cleanly to the right, OR put the search in a row above. **Recommendation:** put search on its own row above the pill row to keep the existing scrollable pill row intact on mobile.
- Placeholder text: "Abgeordnete durchsuchen" / "Abstimmungen durchsuchen".

## Open questions

None.

## Log

- 2026-05-12 — lead: plan created. Dispatching frontend.
- 2026-05-12 — frontend: Added `?q=` URL-synced search to both list pages. Threaded `query` arg into `useMemberListFilters` (filters `m.name`) and `useVoteListFilters` (filters `v.title`), both case-insensitive on trimmed input. Routes parse `q` in `validateSearch`, default to `''`, and write back via `navigate({ search: (s) => ({ ...s, q: v.trim() ? v : undefined }) })`. `MembersList` renders the input inline between the filter-pill cluster and the `N Personen` count (row switched to `flex-wrap` to stay sane on narrow widths). `VotesList` puts the input on its own row above the horizontally-scrolling pill row to preserve mobile scroll. Styling matches `MemberSpeechesSection` exactly (lucide `Search` icon, same border color via `color-mix`, same paddings). Typecheck clean for changed files; pre-existing `server/parties.ts` cohesion error from plan 07 remains untouched.

- 2026-05-12 — frontend: Consistency follow-up. Lifted search input out of the inline filter row in `MembersList` and `AnfragenTab` onto its own full-width row above the filter pills, matching the `VotesList`/`MemberSpeechesSection` convention. Typecheck clean for changed files.
