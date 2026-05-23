# Filter Control Consistency

## Goal

Make search and filter controls consistent across Bundestag list and detail subpages.

## Status

- Lead: complete
- Renamer: blocked, missing target thread id

## Shared Contracts

- Do not render leading filter row icons.
- Remove lucide icons from filter pill buttons.
- Keep party logos in party filter pills and menus.
- Round member motion search inputs to match the rest of the app.
- Put vote detail speech filters on their own row, matching the broader list pattern.
- Do not touch unrelated dirty worktree changes.

## Open Questions

- None.

## Log

- 2026-05-22 lead: Created plan after user reported missed rounded search bars on member motion subpages and requested filter icon cleanup.
- 2026-05-22 lead: Clarified that party logos should stay in filter pills while generic icons are removed.
- 2026-05-22 lead: Removed generic filter pill icons, kept party logos, switched filter rows to the shared Filter icon, rounded missed search inputs, and split vote detail speech filters onto their own row.
- 2026-05-22 lead: Updated affected layout mocks, ran `npm exec tsc -- -p apps/bundestag/tsconfig.json --noEmit`, `git diff --check`, grep checks, and Playwright checks against the reported dev URLs.
- 2026-05-23 lead: Reopened after user said the leading filter icon is not important and should be removed everywhere.
- 2026-05-23 lead: Removed leading filter row icons from list, detail, and speech filter rows, updated mocks, reran grep checks, `npm exec tsc -- -p apps/bundestag/tsconfig.json --noEmit`, `git diff --check`, and Playwright checks on votes and member motion pages.
