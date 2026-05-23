# Vote Waffle Cells

## Goal

Refine the individual member vote boxes on vote detail and Antrag-linked vote result views so the per-party waffle reads cleaner on mobile and desktop.

## Status

- Lead: complete

## Shared Contracts

- Scope changes to `PartyWaffle`, which is shared by vote detail and Antrag vote result.
- Keep one cell per faction member ballot and preserve member links plus tooltips.
- Keep `Fraktionslos` ballots in the total result, but omit them from the faction breakdown.
- Make cells visually smaller and less chunky without changing vote totals or order.
- Avoid another app-wide radius token change.
- Update the vote detail mock with the chosen cell geometry.
- Do not touch unrelated dirty worktree changes.

## Open Questions

- None.

## Log

- 2026-05-23 lead: Created plan after user flagged the individual member vote boxes on the vote detail page as still visually off.
- 2026-05-23 lead: Reduced waffle cells from 12px to 10px, added a 1px visual radius, reduced hover scale from 150% to 125%, and updated the vote detail mock.
- 2026-05-23 lead: Ran `npm exec tsc -- -p apps/bundestag/tsconfig.json --noEmit`, `git diff --check`, and Playwright verified 630 rendered cells at 10px by 10px with 1px radius on the reported vote detail page.
- 2026-05-23 lead: Reopened plan to add section titles and fix the `Fraktionslos` row alignment.
- 2026-05-23 lead: Added `Ergebnis` and `Fraktionen` section titles, fixed the waffle label column at 96px, and reduced text-only party labels to `text-s`.
- 2026-05-23 lead: Playwright verified the reported vote detail page has both section titles, 630 waffle cells, and the `Fraktionslos` cells share the same left edge as the first party row.
- 2026-05-23 lead: Removed `Fraktionslos` from the faction waffle and removed the waffle cell radius as part of the border baseline rollback.
- 2026-05-23 lead: Playwright verified the reported vote detail page no longer renders `Fraktionslos` in the faction waffle and renders 627 square faction cells.
