# 55 Member Speech Summary Count

## Goal

Remove the redundant `x Reden, y Beitraege` summary from the member speeches tab header.

## Scope

- Keep the search field.
- Keep per-group contribution counts.
- Keep the tab and profile stat using grouped `Reden` counts.
- Update the member speeches mock.

## Status

Completed.

## Log

### lead

- Started after confirming the header summary duplicates information already represented by the tab count and grouped rows.
- Removed the visible `x Reden, y Beitraege` header summary.
- Removed the now-unused contribution total from the member speeches hook return value.
- Updated the member speeches mock.
- Ran `npx tsc -p apps/bundestag/tsconfig.json --noEmit`.
