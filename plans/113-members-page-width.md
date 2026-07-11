# Members page width

Status: Completed

## Goal

Fix the Abgeordnete list page so its content width matches the rest of the Bundestag application on desktop and mobile without changing its filtering behavior.

## Constraints

- Keep the existing list, filters, and responsive behavior.
- Use existing layout and spacing tokens.
- Verify German and English member-list routes.
- Keep the work uncommitted until user review. Superseded by the release approval recorded in plan 114.

## Work

- Identify the element causing the wide page.
- Apply the smallest layout fix in the presentational view.
- Run the production build.
- Test desktop and mobile rendering with Playwright because the Browser plugin is not available in this session.

## Agent log

- lead: Removed the uncommitted WP20 planning artifact after the user moved that work to a separate worktree and conversation.
- lead: Reproduced the visual mismatch at 1440px. The members page used a 1024px container while navigation and neighboring list surfaces use 768px.
- lead: Changed search, filters, stats, and member cards to `max-w-3xl` and kept four desktop card columns. Updated the layout mock to match.
- lead: `npm run build -w @machtblick/bundestag` passed the full production build and prerender.
- lead: Browser plugin was unavailable, so Playwright tested `https://dev.machtblick.de/members/` at 1440 by 1000 and 390 by 844, plus `https://dev.machtblick.de/en/members/` at 1440 by 1000.
- lead: Desktop measured 768px wide with four 175px card columns. Mobile matched the 390px viewport with no horizontal overflow. German and English routes rendered 630 cards without console warnings or framework overlays.
- lead: Search interaction changed the URL to `?q=Sanae+Abdi` and reduced the visible card count from 630 to 1.
- user: Approved this validated width fix for inclusion in the plan 114 commit, push, and deployment.
