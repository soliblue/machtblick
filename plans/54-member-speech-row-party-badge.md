# 54 Member Speech Row Party Badge

## Goal

Remove the redundant party badge from collapsed member speech group rows.

## Scope

- Keep the member page header as the party source for the member.
- Keep party badges in expanded exchange context where other speakers can appear.
- Update the member speeches mock to match the collapsed row.

## Status

Completed.

## Log

### lead

- Started after confirming the collapsed group row is already scoped to the member and does not need a repeated party marker.
- Removed the collapsed-row party badge.
- Kept party badges in expanded exchange rows.
- Updated the member speeches mock.
- Ran `npx tsc -p apps/bundestag/tsconfig.json --noEmit`.
