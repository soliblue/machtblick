# 58 Derived Data Materialization

## Goal

Move reviewable public-data derivations out of app read paths and into durable ETL or SQL artifacts.

## Ideal Target State

- Agenda item titles are stored in SQLite with source text, cleaned title, and review status.
- Speech to vote links are stored once with source, confidence, and review status.
- Debate membership is stored once and reused by votes, motions, members, and search.
- Primary vote document selection is stored once instead of inferred by readers.
- Party aliases are normalized before app reads, with display metadata kept in app utilities.
- Member "Reden" counts use persisted debate group semantics if they stay product-facing.
- Read paths only join stored data and perform UI-only filtering or sorting.

## Scope

- Add schema and migrations for persisted agenda items, speech vote links, debate groups, document roles, and optional normalized abstract support.
- Add one-shot or ETL scripts that populate those artifacts from existing SQLite and raw XML.
- Update app server/static data paths to read materialized data.
- Keep UI behavior from plans 53 through 55 intact.
- Verify typecheck and data generation.

## Status

Completed.

## Shared Contracts

- App read paths must not parse raw XML.
- App read paths must not choose a vote for a speech with same-day agenda fallback.
- App read paths must not choose a primary document by title prefix.
- Party display helpers may format canonical values but must not repair upstream source aliases.
- Search should still match every underlying speech contribution.

## Workstreams

### plumber

- Owns DB schema, migrations, ETL or one-shot scripts, and data contracts.
- May edit `db/`, `etl/`, and schema exports.

### backend

- Owns server loaders, `vite-data`, and static generation reads.
- May edit `apps/bundestag/src/server`, `apps/bundestag/vite-data`, and `apps/bundestag/vite.config.ts`.

### frontend

- Owns member speech hooks and views if contract changes reach UI.
- May edit `apps/bundestag/src/hooks`, `apps/bundestag/src/views`, and mocks.

### lead

- Coordinates contracts, resolves overlaps, integrates, and verifies.

## Log

### lead

- Started after audit 57 confirmed recurring read-path derivations.
- Spawned plumber for schema, migrations, and materialization.
- Spawned backend for server/static read-path cleanup against materialized tables.
- Spawned frontend for member speech grouping adaptation if the speech contract changes.
- Added `db/materialize-derived-data.ts` after the plumber subagent stopped before the backfill script.
- Ran `npm run db:materialize`. It populated 714 agenda items, 3980 speech vote links, 628 speech debate groups, 25463 group memberships, 209 vote debate group links, and 187 vote document roles.
- Removed the remaining app-side party alias helper after backend no longer needed it.
- Verified no raw agenda title parser, same-day vote fallback, server-side document picker, or app-side party alias repair remains in app read paths.
- Verified with `npx tsc -p apps/bundestag/tsconfig.json --noEmit`.
- Verified generated data and prerendered routes with `npm --workspace @machtblick/bundestag run build`.
- Fixed a pre-existing React `hrefLang` warning found during browser smoke.
- Re-verified with `npx tsc -p apps/bundestag/tsconfig.json --noEmit`.
- Re-verified generated data and prerendered routes with `npm --workspace @machtblick/bundestag run build`.

### plumber

- Added derived-data schema files and migration `db/migrations/0026_derived_data_materialization.sql`.
- Added reusable party alias seed data and canonical party normalization helpers.
- Added XML agenda extraction under `etl/bundestag-reden-xml/agenda.ts`.

### backend

- Replaced speech vote fallback queries with `speech_vote_links`.
- Replaced agenda title extraction with joins to `plenary_agenda_items` and `speech_debate_groups`.
- Replaced vote and motion debate inference with `vote_debate_groups` plus `speech_debate_group_speeches`.
- Replaced app-side Antrag PDF picking with `vote_document_roles` and existing description decisions.
- Removed raw XML and ETL helper imports from app server read paths.

### frontend

- Updated member speech grouping to prefer persisted `debateGroupId` and persisted `contributionType` when available, with legacy fallbacks for old speech data.
- Verified with `npx tsc -p apps/bundestag/tsconfig.json --noEmit`.
- Verified grouping and short-count fallback behavior with a focused `npx tsx -e` check.

### tester

- Smoke tested `http://localhost:3001/members/bachmann-carolin/speeches/`.
- Confirmed clean console, title-first rows, date second, no raw `Tagesordnungspunkt` in first visible rows, search for `Lubmin`, and expanded context.
