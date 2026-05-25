# 86 No Invisible One-Off Data Fixes

## Goal

Make durable project instructions explicit that data corrections must be reproducible through checked-in ETL, schema, migrations, or normalization scripts.

## Scope

- Tighten `AGENTS.md` data-fix guidance.
- Add the same rule to the plumber source agent.
- Regenerate Codex agent files from the source agent instructions.

## Status

- 2026-05-25 lead: Started after finding that `votes.source_url` appears corrected in the local DB while the namentlich importer still writes the XLSX URL.
- 2026-05-25 lead: Added the no invisible one-off data fix rule to `AGENTS.md` and the plumber source agent, then ran `npm run agents:sync`.
