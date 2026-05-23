# 56 Durable Data Guidance

## Goal

Make project instructions explicit that derived, reviewable public-data fields belong in ETL or SQL, not app read paths.

## Scope

- Tighten the existing Codex-facing data-quality rule in `AGENTS.md`.
- Mirror the same guidance in `CLAUDE.md`.
- Keep the wording short and load-bearing.

## Status

Completed.

## Log

### lead

- Started after the speech agenda title shortcut showed that the existing data-quality rule was too easy to underapply.
- Updated `AGENTS.md` and `CLAUDE.md` to require reviewable derived public-data fields to be materialized through ETL or SQL before app reads.
