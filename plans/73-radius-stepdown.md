# Radius Baseline Rollback

## Goal

Restore the committed baseline border radius behavior after the rounded-control experiments felt too soft.

## Status

- Lead: complete

## Shared Contracts

- Restore shared radius tokens to `8/14/20`.
- Remove token-backed rounded classes added by the rounding pass.
- Keep committed baseline `rounded-full` affordances, like language controls and portraits.
- Keep documentation and layout mocks aligned with baseline behavior.
- Do not touch unrelated dirty worktree changes.

## Open Questions

- None.

## Log

- 2026-05-23 lead: Created plan after user asked for all border radiuses to be less round, but not fully reverted.
- 2026-05-23 lead: Reduced shared radius tokens from `10/16/24` to `8/12/18` and aligned token docs plus the member stats mock.
- 2026-05-23 lead: Ran `npm exec tsc -- -p apps/bundestag/tsconfig.json --noEmit`, `git diff --check`, and Playwright measured the votes search input and filter pill at `18px`.
- 2026-05-23 lead: Reopened plan after user asked for an even less rounded look, then reduced shared radius tokens to `6/9/12` and aligned token docs plus the member stats mock.
- 2026-05-23 lead: Reran `npm exec tsc -- -p apps/bundestag/tsconfig.json --noEmit`, `git diff --check`, and Playwright measured the votes search input and filter pill at `12px`.
- 2026-05-23 lead: Reopened after user asked to revert border radius behavior to baseline. Restored tokens to `8/14/20`, removed token-backed rounded classes from shared controls and filter/search surfaces, restored language controls to committed `rounded-full`, and removed the waffle cell radius while keeping its size and alignment changes.
- 2026-05-23 lead: Ran `npm exec tsc -- -p apps/bundestag/tsconfig.json --noEmit`, `git diff --check`, grep verified no token-backed rounded classes remain, and Playwright measured votes search inputs, filter pills, and waffle cells at `0px` radius.
