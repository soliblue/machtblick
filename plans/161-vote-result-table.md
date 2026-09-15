# Vote result table

## Goal

Replace web detail result charts with the user-approved plain table: total first, then one row per party. Columns are party, Ja, Nein, Enthaltung, and Abwesend. Keep real counts, localized labels, party links, and readable phone layouts. Missing counts must remain distinguishable from zero.

## Status

Complete. TypeScript, theme contract, and desktop/mobile browser checks pass. Dev preview is running for operator review.

## Contract

Use existing server vote and party-summary types. No new fetching or routes. Share the table between vote detail and linked motion results. Preserve the official source link. For non-roll-call votes absence is unavailable; expose unaccounted seats in an additional no-data column when needed. Use a native semantic table because this is a fixed presentation with no sorting or filtering controls.

## Log

- Frontend: reviewed existing result components and backend contracts. The current party charts link to party pages and do not offer member drilldown.

- Frontend: replaced vote and linked-motion result charts with a shared semantic table. Totals are first; parties are sorted by membership and include independents. Preserved party links and official source notice, added DE/EN labels, and kept non-roll-call absence unavailable with a conditional unknown-seat column. Deleted the unused party donut grid. Updated the durable Design contract.
- Frontend verification: `npx tsc --noEmit -p apps/bundestag/tsconfig.json` and `node apps/bundestag/scripts/check-theme-contract.mjs` pass.
- Tester: Playwright Chromium passed 5/5 cases at localhost:5174: UNIFIL desktop/mobile, speed-limit English desktop, and Handzeichen desktop/mobile; CDU/CSU party link navigation passed as neighboring regression (six route/viewport combinations). Total-first rows and every party value matched SQLite fixtures. No console/page errors or horizontal overflow. Screenshots under /tmp/tester-result-table-*.png visually match plain aligned rows and shaded total. Browser plugin unavailable; used existing hoisted Playwright. Screenshot caret suppression initially raced hydration, resolved by preserving caret during screenshots. Test spec removed; preview server preserved.

- Integration: reviewed implementation and desktop/mobile screenshots. Dev preview target route responds HTTP 200. Kept Vite and the development tunnel running for review.

- Follow-up: add shared 12px horizontal inset to the first and last cells, including headers and the total row, as requested.

- Follow-up: increase rightmost header and numeric-cell padding from 12px to the shared 24px token after operator review.
