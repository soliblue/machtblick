Machtblick is a collection of small apps that use public German datasets to inform the public. Each app is self-contained inside apps/, shares utilities through the root, and never imports from another app.

## Authority

- Shipped code and rendered browser or Simulator output are authoritative for current behavior and UI.
- AGENTS.md is the shared instruction source. npm run agents:sync mirrors it to CLAUDE.md and generates Codex agents from .claude/agents/.
- Documentation is for public guidance, operations, provenance, and decisions that code cannot express.
- Temporary research, generated previews, and design alternatives live under /tmp.

## Architecture

- apps/bundestag/src/views is presentational.
- apps/bundestag/src/hooks owns client state and derived behavior.
- apps/bundestag/src/routes is thin route composition.
- apps/bundestag/src/server owns server functions and exported contracts.
- apps/bundestag/build owns prerender paths and generated public artifacts.
- db/schema is the Drizzle contract. Migrations and reproducible normalization live under db/.
- etl contains one importer per upstream source plus shared and one-shot utilities.

## Working model

Root sessions implement and coordinate directly. Delegate only when specialist verification or data ownership materially helps.

| Agent | Scope |
|---|---|
| plumber | ETL, schema, migrations, normalization, and data quality |
| tester | Browser and Simulator verification |
| visibility | Metadata, sharing, crawler, sitemap, and AI discoverability verification |
| deployer | Cloudflare production deploys after current-turn user authorization and development-preview verification |

Product implementation, thread management, and git operations stay with the root session.

Production web and TestFlight releases require explicit user authorization in the current turn. Web releases also require the user to verify the current development preview first. Visibility-only work does not alter existing visible pages without explicit approval.

The operator preview is https://dev.machtblick.de. It is noindexed and not for public sharing.

Create a plan only for complex, concurrent, risky, or multi-session work. A plan contains the goal, shared contracts, blockers, and a short log. Keep completed plans as historical records, while code and rendered output remain authoritative. Small changes do not need a plan.

Integrate work by reading changed files and command output. Do not trust summaries alone.

## Code

- Prefer deletion and direct code over abstractions.
- No comments, docstrings, or source headers.
- No em dash, en dash, or typed double-hyphen substitute in authored text.
- No try-catch unless explicitly requested. Let errors propagate.
- Inline single-use variables and functions.
- Keep files small, one component per file, with explicit imports.
- Use positive control flow, default parameters, and ternaries for simple conditionals.
- Keep views presentational and logic in hooks.
- Import frontend types from server contracts. Never restate them.
- Prefer TanStack Router, Query, Table, and Form before alternatives.
- Use repository-relative paths in checked-in files.

## Data

- Fix data in ETL or a checked-in idempotent normalization or migration, never in the read path.
- Preserve raw upstream material and make refreshes reproducible.
- Materialize reviewable derived fields before apps read them.
- Never fabricate public records or commit placeholder data.
- LLM enrichment runs through local agent CLIs, not provider APIs.
- prompts/auto-refresh.md is the scheduled refresh runbook.

## Web runtime

- Every route must prerender. Update apps/bundestag/build/prerenderPaths.ts with new dynamic segments or nested tabs.
- Server functions run at build time. Routes call them from loaders and read Route.useLoaderData().
- Server functions are read-only and validate inputs at the boundary. Upstream access and writes belong in ETL.
- Never call a server function from useQuery.

## Design

- Web styling lives in apps/bundestag/src/styles/globals.css and apps/bundestag/src/lib/fonts.ts.
- iOS styling lives in apps/ios/src/Core/Theme/.
- Reuse shared components and inspect the nearest shipped view before adding a pattern.
- Design political surfaces for at-a-glance understanding. Do not remove existing data visualizations without explicit approval.
- Use color for party identity, results, and status, never decorative colored left-edge rails.
- Design exploration is temporary. Implementation and rendered output replace it.
- Verify affected themes and breakpoints in a browser or Simulator.
