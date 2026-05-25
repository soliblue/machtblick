# Remove Anfragen

## Goal

Remove the inactive Anfrage feature from Machtblick for now, including database tables, ETL jobs, prerendered member question routes, server functions, UI code, and public metadata that claims question support.

## Status

Done.

## Scope

- Drop current Anfrage tables from the app schema and local SQLite database.
- Remove DIP Anfrage ingestion and answer extraction from the pipeline.
- Keep DIP Antrag and Gesetzgebung ingestion working.
- Remove member question routes from German and English app surfaces.
- Remove unused Anfrage views, hooks, server functions, and mocks.
- Update scheduler preflight and auto-refresh docs so Anfragen no longer block or report refresh status.
- Rebuild and verify that no question pages, sitemap entries, JSON output, or SEO metadata advertise Anfragen.

## Open Questions

- None.

## Log

- Lead: Created plan after user asked to remove Anfragen and all related code, columns, and pipeline.
- Plumber: Removed Anfrage schema exports and source files, deleted the DIP Anfrage and answer-text ETL code paths, narrowed DIP fetch/process/signatory handling to Antrag/Gesetzgebung, updated preflight, auto-refresh prompt, and package scripts, added `0027_remove_anfragen.sql`, and applied it to the local SQLite database.
- Frontend: Removed German and English member question routes, deleted unused Anfragen views, hooks, app server functions, and mocks, removed questions prerender paths and redirects, refreshed the route tree through build generation, and updated public metadata, imprint, and llms copy to stop advertising questions. Verified with `npm --workspace @machtblick/bundestag run build` and targeted question-route and copy scans.
- Lead: Backed up the post-drop SQLite database, compacted it with `VACUUM INTO`, replaced the live database with the compact copy, and confirmed `votes=1967`, `speeches=25463`, `antraege=864`, `vote_antraege=167`, `vote_translations=279`, `speech_translations=2798`, `antrag_descriptions=822`, and `antrag_description_translations=125`. The live database is now 165 MB and has no `anfrag%` tables.
- Visibility: Initial check found no question routes in the sitemap or member surfaces, but flagged stale English motion hreflang links and stale removed-route language-switch links.
- Lead: Fixed removed question and Anfrage language-switch paths to point at live routes, and limited German motion English hreflang alternates to motions with an English translation.
- Lead: Rebuilt `@machtblick/bundestag`, confirmed the build completed, `dist/client` contains no question or Anfrage paths, sitemap, `_redirects`, and `llms.txt` contain no `/questions` or `/anfragen`, `git diff --check` passes, SQLite integrity is `ok`, the schema export has `has_antraege=true` and `has_anfragen=false`, and German motion pages have `missing_hreflang=0`.
- Tester: Verified `/members/fey-katrin/votes/`, `/members/fey-katrin/motions/`, `/motions/334699/`, and the removed `/members/fey-katrin/questions/` 404 behavior. The member tabs are now only `Abstimmungen`, `Reden`, and `Anträge`.
- Visibility: Verified the fresh build prerendered 6,643 pages, sitemap has 2,797 URLs with no questions or Anfragen paths, public metadata has no question or Anfrage references, generated member pages have no stale question links, and German motion pages have no stale English hreflang alternates.
