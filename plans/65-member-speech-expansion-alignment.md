# Member speech expansion alignment

## Goal

Bring member speech group expansion closer to the vote detail speech row pattern by hiding the collapsed preview while open, aligning expanded content to the row edge, and removing the extra expanded-section label.

## Status

Done.

## Scope

- `apps/bundestag/src/views/memberDetail/MemberSpeechGroupRow.tsx`

## Open Questions

- None.

## Log

- Lead: Created plan before edits.
- Lead: Hid the member speech preview while a group is open and removed the expanded timeline left padding.
- Lead: Removed the expanded timeline `Verlauf` and `Exchange` label.
- Lead: Verified with `npx tsc -p apps/bundestag/tsconfig.json --noEmit`.
