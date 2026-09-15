# Plain debate surfaces

## Goal

Keep the existing web debate layout, remove party-tinted backgrounds from summaries and speeches, separate summaries with vertical fg/15 borders, and increase results table edge padding.

## Status

Complete.

## Design

Existing carousel, widths, typography, and interactions remain. Summary panels have transparent backgrounds and vertical separators between adjacent panels. Speech panels have transparent backgrounds. Results retain their table layout with more space at the outer edges.

## Log

- Frontend: inspected summary and speech components; scope is surface styling only.
- Frontend: removed tinted backgrounds from party summaries and conversation speeches, added fg/15 vertical separators between summaries, and updated the theme contract to match. Theme contract and whitespace checks pass. Root owns results padding and browser verification.
- Root: increased results table outer padding to 24px. Browser checks at 1280px and 390px confirmed transparent summary panels, 1px separators, computed table padding, and no page errors or viewport overflow. Desktop screenshot visually reviewed.

- Follow-up: increase summary separator contrast to fg/40 after operator found the fg/15 lines too faint.

- Follow-up: replace container divide utilities with explicit solid right borders on overview summary articles, excluding the last summary.

- Follow-up: soften explicit overview dividers to fg/15. Confirmed no separators were added to the debate timeline; its existing procedural lines are unchanged.
- Tester final QA: Playwright Chromium passed desktop 1280px and iPhone 13 390px on UNIFIL at localhost:5174. Verified 24px right table padding and 511/67/4/48 total; transparent summary/speech articles; explicit solid 1px summary dividers with none on last card; speech expand/collapse works; no viewport overflow or console/page errors. Awaited React hydration before tab interaction. Screenshots /tmp/tester-final-surfaces-desktop.png and /tmp/tester-final-surfaces-mobile.png. Temporary spec removed; preview preserved.
