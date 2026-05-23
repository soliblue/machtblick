# Member speech row count label

## Goal

Remove the repeated per-row contribution count from member speech rows.

## Status

Done.

## Scope

- `apps/bundestag/src/views/memberDetail/MemberSpeechGroupRow.tsx`

## Open Questions

- None.

## Log

- Lead: Created plan before edits.
- Lead: Removed the repeated `Beitrag` and `Beiträge` count from member speech row metadata.
- Lead: Verified with `npx tsc -p apps/bundestag/tsconfig.json --noEmit`.
