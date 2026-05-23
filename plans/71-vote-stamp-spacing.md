# 71 Vote Row Spacing

## Goal

Give vote list rows more breathing room around dividers, with enough reserved space for rotated stamps.

## Status

- Lead: complete

## Shared Contracts

- Keep the list structure unchanged.
- Use the existing spacing token scale.
- Scope the fix to `apps/bundestag/src/views/votesList/VoteRow.tsx`.
- Keep the votes list mock aligned with the layout intent.

## Open Questions

- None.

## Log

- 2026-05-22 lead: Started the plan after confirming the row padding is symmetric and the stamp paint bleeds outside its layout box.
- 2026-05-22 lead: Added bottom spacing to the stamp row, then expanded the full vote row padding to `py-xl`.
- 2026-05-22 lead: Ran `npm exec tsc -- -p apps/bundestag/tsconfig.json --noEmit`.
- 2026-05-22 lead: Reopened the plan to reduce only the first row's top padding after the filter-to-first-row gap still felt too large on mobile.
- 2026-05-22 lead: Added `first:pt-m` to the vote row and reran `npm exec tsc -- -p apps/bundestag/tsconfig.json --noEmit`.
- 2026-05-22 lead: Reopened the plan to replace the vote row border with a thicker rounded light gray divider rule.
- 2026-05-22 lead: Replaced the top border with a rounded `1.5px` `elevated` pseudo-rule and reran `npm exec tsc -- -p apps/bundestag/tsconfig.json --noEmit`.
- 2026-05-22 lead: Reopened the plan to tighten the first row's top padding further.
- 2026-05-22 lead: Changed the first row top padding from `pt-m` to `pt-xs` and reran `npm exec tsc -- -p apps/bundestag/tsconfig.json --noEmit`.
