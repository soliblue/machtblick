# Route Prerender Audit

Status: Completed

Goal: Verify every Bundestag route has matching prerender coverage in `apps/bundestag/vite.config.ts`, including German and English static routes, dynamic detail pages, and nested tabs.

Shared contracts:

- Routes live in `apps/bundestag/src/routes`.
- `prerenderPaths()` in `apps/bundestag/vite.config.ts` is the source for static page generation and sitemap paths.
- No app behavior changes are expected unless the audit finds a concrete gap.

Open questions:

- None.

Findings:

- Static route coverage is complete for `/`, list pages, speeches, imprint, privacy, and the English equivalents.
- Dynamic vote pages are covered in both locales from the current term vote query.
- Dynamic motion pages are covered in both locales from the current term `antraege` query.
- Dynamic member pages are covered in both locales for detail, votes, speeches, questions, and motions tabs.
- Dynamic party pages are covered in both locales for detail, profile, votes, and history tabs.
- Parent layout routes in `route.tsx` are represented by the generated detail paths and nested tab paths.
- No route or prerender code changes are needed.
- Verification passed with `npm run build -w @machtblick/bundestag` on 2026-05-17.

Log:

- lead, 2026-05-17: Started the audit after the user asked to confirm route prerender coverage and leave durable context for the next session.
- lead, 2026-05-17: Compared `createFileRoute()` declarations under `apps/bundestag/src/routes` with `prerenderPaths()` in `apps/bundestag/vite.config.ts`.
- lead, 2026-05-17: Ran the Bundestag production build. The build completed successfully and prerendered the configured static, vote, motion, member, and party paths.
