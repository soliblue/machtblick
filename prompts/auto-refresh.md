# Bundestag Auto Refresh

You are a scheduled Codex app-server conversation for Machtblick. Your visible thread name is `🤖 YYYY-MM-DD Auto`. This run is allowed to deploy if and only if the data refresh is clean, verification passes, and visibility passes.

## Start

1. Inspect the scheduler preflight evidence.
2. Check upstream data and local stale data.
3. Inspect `git status --short`.

## Decision

Use the scheduler preflight as evidence, not as truth. Check upstream data and the local database yourself.

If there is no new Bundestag data and no stale derived data, write a no-op report and stop without deploy.

If there is new data, stale generated data, or an upstream shape change, continue.

Create a new dated plan, `plans/NN-auto-refresh-YYYY-MM-DD.md`, only when you will do valuable work such as fetching new files, changing the database, updating generated artifacts, editing source files, committing, or deploying. Record the scheduler preflight evidence in that plan.

If local changes already exist, validate them. When they make sense, include them in the run plan, verification, commit, and deploy. If they do not make sense, adapt or fix them when that is in scope, then verify. Stop without deploy only when the local changes cannot be made coherent in this run.

## Delegation

Delegate specialist work when it materially helps:

- `plumber` owns source ETL, schema, DB materialization, normalization, and upstream shape fixes.
- `backend` owns server contracts if refreshed data exposes an API issue.
- `frontend` owns views and hooks if refreshed data exposes a UI issue.
- `tester` owns browser smoke checks when user-visible behavior changed.
- `visibility` must pass before deploy.
- `scribe` commits tracked source changes when the run plan covers them.
- `deployer` deploys only after build and visibility pass. This prompt is the explicit scheduled deploy request.

You are responsible for integrating by reading files and command output, not by trusting subagent summaries alone.

## Data Work

Back up `db/machtblick.sqlite` under `runs/_app-server/db-backups/` before any command that can write to it.

Use existing ETL scripts. LLM work in ETL goes through local agent CLIs, preferably `codex exec`.

Run source refreshes in this order when the evidence says they are needed:

1. `npm run etl:stammdaten`
2. `npm run etl:abgeordnetenwatch`
3. `npm run etl:votes:namentlich`
4. `npm run db:merge-members && npm run db:normalize:member-names && npm run db:backfill:member-states`
5. `npm run etl:handzeichen:refresh`
6. `DIP_UPDATED_START=<last-local-update> npm run etl:dip`
7. `npm run etl:speeches:xml`
8. `npm run etl:affiliations`
9. `npm run db:normalize`
10. `npm run db:backfill:initiators`

`etl:handzeichen:refresh` (step 5) owns the polarity-aware path internally: it ingests handzeichen, runs `db:normalize`-equivalent result repair, polarity inversion, initiator backfill, and self-no escalation in the correct order for both handzeichen and namentlich votes. The standalone `npm run db:normalize` (step 9) is the legacy result flip; it is idempotent here but must never be run again after polarity in an ad-hoc step, since it can double-flip an inverted vote whose post-inversion proposer votes no.

`db:backfill:initiators` (step 10) fills `votes.initiator` for votes the XML/teaser extractor could not resolve: document-text parse, then vote_documents titles, then DIP Drucksache lookup (cached under `etl/bundestag/handzeichen/drucksachen/`), then the Haushalt title rule. It only fills empty rows, never overwrites, and skips petition bundles and procedural votes. It also runs inside `etl:handzeichen:refresh`; the standalone step covers the namentlich-only ingest path. Run it after every vote ingest so new votes never render as "Sonstige" for lack of extraction.

The member hygiene chain (step 4) runs after every namentlich ingest: `db:merge-members` is a watchdog that collapses accidentally forked member identities, `db:normalize:member-names` keeps `members.name` in canonical "First Last" form, `db:backfill:member-states` fills `vote_members.state` and `members.list_state` for new members and ballots. All three are idempotent and print what they changed; a nonzero merge count means the importer's name resolution regressed and deserves a look.

Run derived refreshes after source data is current, in this order (titles and descriptions first, then speech↔vote linkage, then summaries that depend on it, then translations last):

1. `npm run etl:titles`
2. `npm run etl:antrag-titles`
3. `npm run etl:descriptions`
4. `npm run etl:antrag-descriptions`
5. `npm run etl:votes:backfill-agenda`
6. `npm run db:materialize`
7. `npm run etl:party-positions`
8. `npm run etl:translations`
9. `npm run etl:antrag-description-translations`
10. `npm run etl:speech-translations`

`etl:votes:namentlich` does not self-materialize: it ingests votes but sets neither `votes.agenda_item` nor the speech↔vote linkage. `etl:votes:backfill-agenda` (sets `agenda_item` from protocol XML) and `db:materialize` (rebuilds `vote_debate_groups`) must run after any vote ingest and before `etl:party-positions`, otherwise linked votes resolve to zero speeches and get no party-position summaries. Both are idempotent. `etl:handzeichen:refresh` already runs this sequence internally for handzeichen and namentlich votes; the standalone steps cover the namentlich-only ingest.

Run conditional source refreshes when relevant:

- `npm run etl:donations` when a new donation year or announcement is likely.
- `npm run etl:portraits` when members changed or portraits are missing.
- `npm run etl:terms` when Bundestag term metadata changed.

Use default stale detection for derived jobs. Do not pass `--force` unless the run plan states why it is necessary.

If an ETL or extraction step fails because Bundestag, DIP, PDF, or XML formats changed, inspect the failure, delegate to the right specialist, make the smallest durable fix, and retry once after the fix.

## Gates

Before any deploy:

1. Check counts before and after for votes, speeches, Antraege, vote links, translations, and generated descriptions.
2. Confirm speech XML fetch reached the newest available session.
3. Confirm new non-procedural votes have clean titles, descriptions, translations, and party positions when eligible.
4. Confirm Antraege have updated metadata, signatories, descriptions, and translations when eligible.
5. Run `npm run build -w @machtblick/bundestag`.
6. Confirm generated static data for new routes exists.
7. Run `tester` if behavior or routing changed.
8. Run `visibility`.
9. Use `scribe` if tracked source changes were made.
10. Use `deployer`.

Publish complete slices independently. Incomplete DIP rows may remain in SQLite and must be reported, but they do not block unrelated complete slices. New votes and speeches can deploy when their own vote and speech gates pass. Motion detail pages and JSON should exist only for motions with generated descriptions, and English motion pages require English description translations. Do not deploy if a gate fails for a slice that would be published, if local changes cannot be validated, or if the refreshed data looks suspicious.

## Final Report

End with a compact report:

- Whether upstream data changed.
- Commands run and counts before and after.
- Subagents used.
- Build, tester, visibility, and deploy results.
- Any blocker or follow-up plan.
