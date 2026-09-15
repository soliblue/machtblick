# Light-only web

## Goal
Remove dark appearance and its controls from the web app. Keep the iOS app unchanged.

## Design
Existing desktop navigation and mobile menu retain language selection. Web surfaces always use the current light palette, including initial HTML, saved dark preferences, and dark OS settings.

## Status
Implemented. TypeScript and static appearance contracts pass. Browser verification assigned to tester.

## Log
- Frontend: located theme controls, initialization, dark CSS, and build contract checks. Existing table and debate changes remain intact.
- Frontend: removed desktop/mobile theme controls, stored-theme initialization, theme hook, dark CSS, and unused copy. Initial HTML advertises light color scheme and CSS enforces only light. Existing saved dark preferences are ignored. No iOS files changed. `npx tsc --noEmit -p apps/bundestag/tsconfig.json` and `node apps/bundestag/scripts/check-theme-contract.mjs` passed.
- Tester: Playwright Chromium passed 6/6 cases on localhost:5174: feed, Sanae Abdi member, and UNIFIL vote at 1280px desktop and iPhone 13 mobile. Every context emulated a dark OS and persisted machtblick.theme=dark. At DOMContentLoaded and after React hydration, computed background remained white and color-scheme was light only. No appearance radios or label in desktop navigation or opened mobile menu; language links remain. Menu open/close works, no viewport overflow, no console/page errors. Screenshots /tmp/tester-light-only-*.png; temporary spec removed and preview preserved.
