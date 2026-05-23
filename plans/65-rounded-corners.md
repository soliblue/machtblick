# Rounded Corners

## Goal

Make controls and framed UI surfaces slightly more rounded across the Bundestag app.

## Status

Complete.

## Scope

- Increase shared radius tokens.
- Add token-backed radius classes to shared UI primitives that currently have sharp corners.
- Round custom vote and speech search fields, filter pills, filter menus, language controls, and pager buttons.
- Keep portraits, dots, and charts circular.

## Open Questions

- None.

## Log

- 2026-05-22 lead: Created plan after scanning rounded usage. Source has only a few explicit rounded classes, while shared primitives mostly lack radius classes.
- 2026-05-22 lead: Increased radius tokens to 10/16/24, added token-backed radii to shared controls, custom filters, search fields, language controls, pager buttons, and updated current token docs plus the member stats mock.
- 2026-05-22 lead: Verified generated CSS includes the token radius utilities. Vite served `/votes/` on port 3001 with HTTP 200, and Playwright measured 24px radii on the vote search input and a filter pill.
