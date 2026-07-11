# Preprocessing model config

Status: Completed

## Goal

Route every Bundestag preprocessing LLM job through one committed configuration using `gpt-5.6-sol` with high reasoning, preserve structured output contracts, and record trustworthy model provenance for future regeneration.

## Contracts

- The committed preprocessing model is `gpt-5.6-sol`.
- The committed reasoning effort is `high`.
- Runtime `.env` values do not select the preprocessing model.
- All Bundestag ETL model calls use one shared runner.
- Existing prompts and output schemas remain behaviorally unchanged unless compatibility requires a narrow adjustment.
- Generated rows store the configured model and reasoning effort where their tables own provenance.
- Historical rows are not force-regenerated in this change.
- No direct provider SDK or API key integration is added. ETL continues through the local Codex CLI.

## Work

- Add the shared preprocessing configuration and Codex runner.
- Migrate summaries, titles, translations, polarity checks, handzeichen extraction, and PDF extraction fallback.
- Remove active Claude and per-job model selection from Bundestag ETL.
- Fix vote-description provenance, which currently writes `sonnet` regardless of the active generator.
- Add reproducible schema support for reasoning-effort provenance where generated tables store model metadata.
- Validate model inventory, schemas, representative dry runs, and the Bundestag build.
- Commit and push the verified change to `main`.

## Agent log

- lead: Audited current model usage and database provenance. Current defaults are split across GPT-5.5, GPT-5.4 Mini, Claude Sonnet, and Claude Haiku 4.5. The vote-description decision writer hardcodes incorrect `sonnet` provenance.
- lead: Read the current OpenAI GPT-5.6 Sol migration and prompting guidance. The requested `high` reasoning setting is supported by GPT-5.6 Sol.
- plumber: Added one shared Codex runner and committed configuration under `etl/bundestag/preprocessing/`. Migrated every active Bundestag model call, removed runtime provider and model selectors, and added provenance schema support.
- lead: A live CLI smoke test confirmed `gpt-5.6-sol` with high reasoning on Codex CLI 0.144.1.
- lead: A live structured-output test found that the former Claude handzeichen schemas were not strict OpenAI schemas. Added required `additionalProperties: false` declarations and expanded static validation to enforce strict object schemas. The retry returned valid JSON.
- lead: Applied `db/migrations/0029_preprocessing_model_provenance.sql` to a temporary database copy. All new model and reasoning columns were present, and dry runs resolved the committed model configuration.
- lead: Ran real ETL samples against the temporary database for vote descriptions, motion descriptions, party positions, vote translations, motion description translations, English motion titles, German vote titles, and speech translations. Every sample completed and stored `gpt-5.6-sol` with `high` where provenance is materialized.
- lead: Backed up the local database to `runs/_app-server/db-backups/machtblick-20260711T090100Z-before-model-provenance.sqlite`, completed the checked-in provenance migration on the local database, and confirmed SQLite integrity is `ok`.
- lead: `npm run etl:preprocessing:validate`, JavaScript syntax checks, migration checks, and `git diff --check` passed.
- lead: The first Bundestag build exposed the partially-applied local provenance schema and failed during prerender. After completing migration 0029, `npm run build -w @machtblick/bundestag` passed the full build and prerender.
- lead: Root `npx tsc --noEmit` remains unavailable as a clean gate because of pre-existing TS5097 import-extension errors and one unrelated DIP typing error. The affected app production build passed.
- plumber: Added one committed Bundestag preprocessing config (`gpt-5.6-sol`, reasoning `high`) and one shared Codex CLI runner. Migrated descriptions, titles, polarity, self-NO escalation, handzeichen extraction/enrichment, vote translations, Antrag translations, party-position summaries, speech translations, and PDF fallback extraction off direct Claude/per-job model selection.
- plumber: Added nullable reasoning-effort provenance columns for generated tables that already store model metadata, plus title-specific model provenance for `antrag_description_translations` title fields. Fixed vote-description writes to store the committed model instead of hardcoded `sonnet`.
- plumber: Added static validation script `npm run etl:preprocessing:validate` and committed JSON schemas for Codex-backed handzeichen extraction/enrichment and Antrag title translation. Quick validation passed: all Bundestag `.mjs` files pass `node --check`; preprocessing validator reports `model=gpt-5.6-sol reasoning=high` and only the shared runner spawns Codex directly.
