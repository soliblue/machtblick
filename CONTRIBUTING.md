# Contributing

Issues and focused pull requests are welcome. By contributing you agree your work is licensed under the project's AGPL-3.0 license (see LICENSE).

Open an issue before beginning a large feature or data-model change. Use a short numbered plan under `plans/` for complex, concurrent, risky, or multi-session work. Small changes do not need one, and completed plans remain as historical records.

## Project boundaries

- Keep each app self-contained inside `apps/`.
- Put reusable code in a root package only when a second app needs it.
- Keep views presentational, hooks responsible for client logic, and routes thin.
- Fix public-data inconsistencies in ETL or reproducible database normalization.
- Update prerender paths with every new route.
- Reuse the code-based design tokens and neighboring shipped UI patterns.
- Do not add comments, large files, absolute filesystem paths, or catch-all error handling.

## Sensitive and generated files

Never commit credentials, `.env` files, signing material, generated databases, downloaded portraits, caches, or build output.

Contributions must contain only material the contributor has the right to submit. Preserve source and license metadata for third-party data and assets.

## Verification

Run the narrow checks relevant to the changed surface. Web source changes normally require TypeScript validation and a production build. Native changes require the checked-in localization and contract checks plus the macOS iOS build workflow.
