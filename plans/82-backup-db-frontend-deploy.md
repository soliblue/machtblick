# Backup DB Frontend Deploy

## Goal

Deploy the current frontend/source state against the pre-refresh SQLite backup while the 2026-05-24 refreshed database is treated as suspicious.

## Status

In progress.

## Shared Contract

- Keep the frontend/source commits already on `main`.
- Use `runs/_app-server/db-backups/machtblick-20260524T0855Z-before-auto-refresh.sqlite` as the candidate data rollback.
- Back up `db/machtblick.sqlite` before replacing it.
- Verify counts before and after restore.
- Run the Bundestag build and visibility checks before deploy.
- Deploy only after the build artifact is produced from the restored database.

## Log

- Lead: Created plan after user requested deploying with the old backup database and current frontend changes.
- Lead: Compared current DB to backup. Current DB had 1969 votes, newest vote date 2026-05-21, and contained the incomplete session 80 Ökodesign vote. Backup had 1967 votes, newest vote date 2026-05-08, and did not contain that vote.
- Lead: Backed up the current DB to `runs/_app-server/db-backups/machtblick-20260525T111922Z-before-backup-db-deploy.sqlite`, restored `runs/_app-server/db-backups/machtblick-20260524T0855Z-before-auto-refresh.sqlite` to `db/machtblick.sqlite`, and confirmed `PRAGMA integrity_check` returned `ok`.
- Lead: Ran `npm run build -w @machtblick/bundestag`; build and prerender completed successfully.
- Lead: Truncated the SQLite WAL with `PRAGMA wal_checkpoint(TRUNCATE)`. The WAL is now 0 bytes, restored DB counts are 1967 votes, 25463 speeches, 833 Anträge, 8467 Anfragen, and the session 80 Ökodesign vote count is 0.
- Lead: Verified the generated output has 279 German and 279 English vote detail pages. The May 8 vote route returns 200, the session 80 Ökodesign route returns 404, and the sitemap contains the May 8 vote but not the session 80 Ökodesign vote.
- Tester: PASS. `/votes/` loaded with no type filter selected and showed both named and handzeichen rows. The May 8 vote detail page loaded with summary and details. The session 80 Ökodesign route returned 404.
- Visibility: PASS. Existing build output had 7907 generated HTML files, complete HTML metadata, working sharing previews, crawler policy, AI discovery files, favicons, manifest, 2797 sitemap URLs, and 7893 JSON alternates.
