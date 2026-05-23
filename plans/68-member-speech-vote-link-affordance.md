# Member speech vote link affordance

## Goal

Reduce accidental navigation from member speech rows by making the row title expand the group and moving linked vote navigation into a smaller explicit metadata action.

## Status

Done.

## Scope

- `apps/bundestag/src/views/memberDetail/MemberSpeechGroupRow.tsx`

## Open Questions

- None.

## Log

- Lead: Created plan before edits.
- Lead: Made linked vote titles plain row titles and moved navigation to a compact metadata link.
- Lead: Verified with `npx tsc -p apps/bundestag/tsconfig.json --noEmit`.
