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
5. `npm run db:normalize`
6. `npm run etl:handzeichen:refresh`
7. `DIP_UPDATED_START=<last-local-update> npm run etl:dip`
8. `npm run etl:speeches:xml`
9. `npm run etl:affiliations`
10. `npm run db:backfill:initiators`

`etl:affiliations` (step 9) is a full delete-and-rewrite of `member_affiliations` and ends by chaining `db/close-departed-mandates.ts`, which closes `valid_to` for departed MdBs (Stammdaten `MDBWP_BIS` first, then a roster-gap fallback for members absent from the last two namentliche roll-call rosters). Never run the affiliations ingest without the close step: the rewrite reopens every previously-closed mandate and the app then counts departed members (Baerbock, Habeck, ...) as sitting. `npm run db:close-departed` re-runs the close standalone; the chamber-wide sitting count it prints must equal the seat total (630 in WP21).

`db:normalize` (step 5) is the legacy result flip (proposer voted no on an `angenommen` vote). It must run after the namentlich ingest and strictly before `etl:handzeichen:refresh`, because the refresh runs polarity inversion internally and `db:normalize` after polarity can double-flip an inverted vote whose post-inversion proposer votes no. Never run it again later in the same run.

`etl:handzeichen:refresh` (step 6) owns the polarity-aware path internally: it ingests handzeichen, then runs polarity inversion, the procedural flagger, initiator backfill, self-no escalation, and the self-no and suspicious-initiator audits in the correct order for both handzeichen and namentlich votes, followed by descriptions, titles, agenda backfill, materialization, party positions, validation, and translations for its slice.

`db:backfill:initiators` (step 10) fills `votes.initiator` for votes the XML/teaser extractor could not resolve: document-text parse, then vote_documents titles, then DIP Drucksache lookup (cached under `etl/bundestag/handzeichen/drucksachen/`), then the Haushalt title rule. It only fills empty rows, never overwrites, and skips petition bundles and procedural votes. It also runs inside `etl:handzeichen:refresh`; the standalone step covers the namentlich-only ingest path. Run it after every vote ingest so new votes never render as "Sonstige" for lack of extraction.

The member hygiene chain (step 4) runs after every namentlich ingest: `db:merge-members` is a watchdog that collapses accidentally forked member identities, `db:normalize:member-names` keeps `members.name` in canonical "First Last" form, `db:backfill:member-states` fills `vote_members.state` and `members.list_state` for new members and ballots. All three are idempotent and print what they changed; a nonzero merge count means the importer's name resolution regressed and deserves a look.

Run derived refreshes after source data is current, in this order (titles and descriptions first, then speech↔vote linkage, then summaries that depend on it, then translations last):

1. `npm run etl:titles`
2. `npm run etl:antrag-titles`
3. `npm run etl:descriptions`
4. `npm run etl:antrag-descriptions`
5. `npm run etl:votes:backfill-agenda`
6. `npm run db:normalize:reading-pairs`
7. `npm run db:materialize`
8. `npm run etl:party-positions`
9. `npm run etl:translations`
10. `npm run etl:antrag-description-translations`
11. `npm run etl:antrag-title-translations`
12. `npm run etl:speech-translations`

`etl:antrag-title-translations` fills English `title`/`clean_title` on `antrag_description_translations` for every motion that already has an English description translation. It is hash-keyed on the German title pair and idempotent; it must run after `etl:antrag-titles` and `etl:antrag-description-translations`, otherwise new English motion pages render German titles.

`db:normalize:reading-pairs` propagates metadata, documents, descriptions, and clean-title stage labels across 2./3.-Beratung sibling votes of the same bill and links related speeches to namentliche Schlussabstimmungen whose debate happened at an earlier reading. It is idempotent (NULL-only fills, INSERT OR IGNORE copies) and must run after `etl:votes:backfill-agenda` and before `db:materialize`, because materialization consumes the `speeches.vote_id` links and copied `agenda_item` values it writes. It also runs inside `etl:handzeichen:refresh`.

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
3. Confirm every new vote has a clean title (`SELECT COUNT(*) FROM votes WHERE clean_title IS NULL` must be 0; `etl:titles` fills procedural and hammelsprung rows deterministically from the source title), and new non-procedural votes have descriptions, translations, and party positions when eligible.
4. Confirm Antraege have updated metadata, signatories, descriptions, and translations when eligible.
5. Run `npm run build -w @machtblick/bundestag`.
6. Confirm generated static data for new routes exists.
7. Run `tester` if behavior or routing changed.
8. Run `visibility`.
9. Use `scribe` if tracked source changes were made.
10. Use `deployer`.
11. After a successful deploy, run `npm run indexnow -w @machtblick/bundestag` to ping IndexNow with the URLs whose sitemap lastmod falls inside the refresh window (defaults to 7 days; pass `-- --days N` after a longer gap). Report the ping status code.

Publish complete slices independently. Incomplete DIP rows may remain in SQLite and must be reported, but they do not block unrelated complete slices. New votes and speeches can deploy when their own vote and speech gates pass. Motion detail pages and JSON should exist only for motions with generated descriptions, and English motion pages require English description translations. Do not deploy if a gate fails for a slice that would be published, if local changes cannot be validated, or if the refreshed data looks suspicious.

## Final Report

End with a compact report:

- Whether upstream data changed.
- Commands run and counts before and after.
- Subagents used.
- Build, tester, visibility, and deploy results.
- Any blocker or follow-up plan.
