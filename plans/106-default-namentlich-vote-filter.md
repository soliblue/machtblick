# Default namentlich vote filter

## Goal

Make the Bundestag vote list default to the `namentlich` vote type filter, then verify, commit, and deploy.

## Status

Verified. Ready for commit and deploy.

## Scope

- Change German and English vote list routes.
- Keep explicit `type` query values working.
- Leave unrelated `.design-sync/` and `plans/92-logo-variants.md` untracked.

## Verification

- Run build for `@machtblick/bundestag`.
- Run browser smoke for German and English vote lists.
- Run visibility before deploy.

## Log

### lead

- Created this plan.
- Found route search validation in `apps/bundestag/src/routes/votes/index.tsx` and `apps/bundestag/src/routes/en/votes/index.tsx`.
- Set invalid or missing vote `type` search values to `namentlich` in both routes.
- `npm run build -w @machtblick/bundestag` passed. No tracked generated files changed.

### tester

- `vite preview` found port 3000 occupied by AgentPit, served Machtblick on `http://localhost:3001/`.
- `TEST_BASE_URL=http://localhost:3001 npx playwright test apps/bundestag/test/.tester-default-namentlich.spec.ts --reporter=line` passed 4/4 for German and English vote list default namentlich plus explicit handzeichen, with no console or page errors.

### visibility

- Pre-deploy gate checked built `/votes/` and `/en/votes/` HTML in `apps/bundestag/dist/client`.
- Both pages pass title, description, robots, absolute canonical, reciprocal `hreflang`, Open Graph, X card, JSON-LD parse, and rendered default `namentlich` filter checks.
- Static discovery passes for `robots.txt`, `llms.txt`, `.well-known/api-catalog`, `_headers`, `sitemap.xml`, `site.webmanifest`, favicons, `og-image.png` at 1200x630, and JSON endpoint links.
- Live canonical URLs `https://machtblick.de/votes/` and `https://machtblick.de/en/votes/` return 200 with no redirect. No blocking visibility issues found.
