---
name: drizzle-drift-dip-person-id
description: members.dip_person_id is in the DB but missing from db/schema/members.ts. drizzle-kit generate will try to drop it on every run — strip the ALTER before applying.
metadata:
  type: project
---

`members.dip_person_id INTEGER` was added by raw SQL during the initial DIP Anfragen ingest (plan 06 log, 2026-05-12). It was never added back to `db/schema/members.ts`. Every `npm run db:generate` run will emit `ALTER TABLE members DROP COLUMN dip_person_id` in the new migration.

**Why:** the previous plumber consciously kept the schema/DB out of sync rather than touch the schema mid-ingest. The journal entries are also non-monotonic (0006_fantastic_firelord exists on disk but with the older snapshot index), so naively reconciling could break replay.

**How to apply:** when generating a new migration, open the generated SQL, delete the `ALTER TABLE members DROP COLUMN dip_person_id;` statement, apply with `sqlite3 db/machtblick.sqlite < db/migrations/<file>.sql` (don't trust `db:migrate`), then rename the file + the `meta/<idx>_snapshot.json` + the `meta/_journal.json` entry to slot above the highest existing `00NN_*` migration. Documented in `.claude/agents/plumber.md` under "Migration drift workaround". Real fix is to add the column to `db/schema/members.ts`, but that needs lead's call.
