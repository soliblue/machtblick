# Contributing

Issues and focused pull requests are welcome.

Open an issue before beginning a large feature or data-model change. Every implementation change needs a numbered plan under `plans/` that records its goal, status, contracts, open questions, and append-only work log.

## Project boundaries

- Keep each app self-contained inside `apps/`.
- Put reusable code in a root package only when a second app needs it.
- Keep views presentational, hooks responsible for client logic, and routes thin.
- Fix public-data inconsistencies in ETL or reproducible database normalization.
- Update prerender paths with every new route.
- Use the repository's fixed design tokens and curated UI primitives.
- Do not add comments, large files, absolute filesystem paths, or catch-all error handling.

## Sensitive and generated files

Never commit credentials, `.env` files, signing material, generated databases, downloaded portraits, caches, or build output.

Contributions must contain only material the contributor has the right to submit. Preserve source and license metadata for third-party data and assets.

## Verification

Run the narrow checks relevant to the changed surface. Web source changes normally require TypeScript validation and a production build. Native changes require the checked-in localization and contract checks plus the macOS iOS build workflow.
