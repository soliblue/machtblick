# 53 Member Speech Title Priority

## Goal

Make grouped member speech rows lead with the debate or vote title, with the date as secondary metadata.

## Scope

- Keep vote titles linked when a grouped row has a vote.
- Show protocol-derived agenda titles as the primary row label for unlinked speech groups.
- Move the date into the small metadata line beside contribution counts.
- Update the member speeches mock to match the row hierarchy.

## Status

Completed.

## Log

### lead

- Started after seeing the date was still styled as the primary row label even after agenda titles became available.
- Updated grouped speech rows to render vote or agenda titles as the primary line.
- Moved the date into the small metadata line with contribution counts.
- Updated the member speeches mock.
- Ran `npx tsc -p apps/bundestag/tsconfig.json --noEmit`.
