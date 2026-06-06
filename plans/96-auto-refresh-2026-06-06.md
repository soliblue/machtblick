# Bundestag auto refresh 2026-06-06

## Goal

Refresh Bundestag public data and derived artifacts when upstream data or stale local generated data warrants it. Deploy only if refresh, verification, visibility, and source-change handling all pass.

## Status

Ready to deploy.

## Scheduler preflight evidence

- Thread name: `🤖 2026-06-06 Auto`
- Preflight command: `scripts/bundestag-auto-refresh-preflight`
- Exit: `0` at `20260606T071609Z`
- Branch: `main`
- Git status at preflight: `?? plans/92-logo-variants.md`
- SQLite path: `db/machtblick.sqlite`
- SQLite size: `208.7 MB`
- Votes: `2100`
- Newest vote date: `2026-05-22`
- Newest Bundestag vote id: `1004`
- Vote types: `hammelsprung=1`, `handzeichen=250`, `namentlich=1849`
- Speeches: `26359`
- Newest speech date: `2026-05-22`
- Newest speech session: `21-81`
- Speeches without member: `13745`
- Speeches without vote link: `23496`
- Antraege: `885`
- Newest Antrag update: `2026-05-29T20:10:20+02:00`
- Antraege missing descriptions: `11`
- Vote Antraege links: `169`
- Vote translations: `2077`
- Speech translations: `2809`
- Antrag description translations: `874`
- Speech XML probes: `21082=404`, `21083=404`, `21084=404`
- DIP Vorgang update start: `2026-05-29T20:10:20+02:00`
- DIP Vorgang num found: `1411`

## Local verification evidence

- `git status --short`: `?? plans/92-logo-variants.md`
- Local count verification matched preflight for votes, speeches, Antraege, vote translations, speech translations, and Antrag description translations.
- Newest local dates matched preflight: votes `2026-05-22`, speeches `2026-05-22`, Antraege `2026-05-29T20:10:20+02:00`.
- Existing untracked `plans/92-logo-variants.md` is unrelated selection material for logo variants, with no production source changes.
- Derived stale check found:
  - `19` term 21 visible non-procedural votes without simplified descriptions.
  - `3` visible non-procedural votes without clean titles.
  - `0` eligible Antraege missing descriptions.
  - `52` described Antraege without clean titles.
  - The `11` Antraege counted as missing descriptions have no Drucksache PDF URL and are not eligible for description generation.

## Shared contracts

- Back up `db/machtblick.sqlite` under `runs/_app-server/db-backups/` before the first write-capable DB command.
- Use existing ETL scripts.
- Do not use `--force` unless this plan is updated with a concrete reason.
- Keep unrelated `plans/92-logo-variants.md` out of the refresh commit unless the user asks otherwise.
- Publish complete slices only. Incomplete DIP rows may remain in SQLite and must be reported.

## Gates

- Counts before and after for votes, speeches, Antraege, vote links, translations, and generated descriptions.
- Confirm speech XML fetch reached the newest available session.
- Confirm new non-procedural votes have clean titles, descriptions, translations, and party positions when eligible.
- Confirm Antraege have updated metadata, signatories, descriptions, and translations when eligible.
- Run `npm run build -w @machtblick/bundestag`.
- Confirm generated static data for new routes exists.
- Run tester if behavior or routing changed.
- Run visibility before deploy.
- Use scribe if tracked source changes were made.
- Use deployer only after build and visibility pass.

## Open questions

- Whether DIP has rows newer than local `2026-05-29T20:10:20+02:00` after an independent upstream check.
- Whether stale vote descriptions are truly eligible or lack usable source PDFs.
  - Resolved: all `19` skipped vote descriptions lack usable source PDFs under the existing picker.

## Log

### lead

- Verified preflight DB counts and newest local dates against SQLite.
- Inspected `plans/92-logo-variants.md`; it is unrelated, untracked selection material and has no production source changes.
- Inspected ETL scripts before running write-capable commands.
- Found stale generated data locally, so the run is not a no-op.
- Created this plan before DB writes.
- Backed up SQLite to `runs/_app-server/db-backups/machtblick-20260606T071820Z-before-auto-refresh.sqlite`.
- Independently confirmed no new namentliche votes after Bundestag id `1004` and no speech XML after `21081`.
- Independently confirmed relevant DIP deltas: `35` Antrag rows and `49` Gesetzgebung rows newer than local `2026-05-29T20:10:20+02:00`.
- Ran incremental DIP fetch and process with `DIP_UPDATED_START=2026-05-29T20:10:20+02:00`; Antraege increased from `885` to `889`.
- Ran DB normalization; no vote result flips.
- Ran vote titles; `1` written, `2` low confidence skipped.
- Ran Antrag titles twice; `56` titles written across stale and newly described rows.
- Ran vote descriptions; `19` skipped because no usable source PDF was found.
- Ran Antrag descriptions with `CODEX_MODEL=gpt-5.4-mini` after local `gpt-5.2` was unsupported; `4` new descriptions written.
- Ran vote, Antrag, and speech translations. Switched Antrag translation retry to `gpt-5.3-codex-spark` after `gpt-5.4-mini` batch timeouts. Final stale detectors returned zero.
- Ran speech XML fetch and ingest after plumber found `21081.xml` available upstream. Session `21-81` now has `276` XML speeches.
- Found previous PDF fallback speeches for session `21-81` remained as duplicate rows. Patched XML ingest to delete non-XML speech rows and dependent translation/link rows for sessions now covered by XML, then reran ingest.
- Ran `npm run build -w @machtblick/bundestag`; build and prerender passed after data refresh.
- Confirmed new motion static files exist for `335552`, `335555`, `335556`, and `335573` in German and English.
- Visibility found missing AI discovery JSON at `/.well-known/mcp/server-card.json` and `/.well-known/agent-skills/index.json`. Added static JSON files and headers.
- Rebuilt after the AI discovery fix. Final preview URL was `http://127.0.0.1:3002`.
- Final visibility gate passed with no blockers.
- Final tester gate passed on `/motions/335573/`, `/en/motions/335573/`, the vote `2026-05-22-1004-ablehnung-eines-antrags-zur-arzneimittelversorgung`, and `/speeches/` across desktop and mobile.

### plumber

- Read-only freshness and stale-data verification found no new roll-call, handzeichen, or hammelsprung votes, no speech sessions after `21-81`, and `21081.xml` available upstream with `276` parsed rows while local session `21-81` still had `11` PDF-fallback rows.

### visibility

- Final gate passed. HTML metadata, sharing previews, crawler access, AI discovery, favicons, manifest, sitemap, and JSON alternates passed.
- Confirmed `/.well-known/mcp/server-card.json` and `/.well-known/agent-skills/index.json` return `200 application/json` with no redirects on the final preview.

### tester

- Final smoke passed. Refreshed motion, vote, and speeches paths rendered on desktop and mobile with no console errors, network errors, layout overlap, horizontal overflow, or clipped visible text.
