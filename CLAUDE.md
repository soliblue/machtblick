Machtblick is one app for making German politics accessible. It has one web entry point at `https://machtblick.de` and one iOS app on the App Store at `https://apps.apple.com/us/app/machtblick/id6787755187`. Deployment may use subdomains, but users always enter through this single web app and single iOS app. Its current coverage area makes Bundestag data accessible. The goal is to become the go-to app for German politics by expanding into historical Bundestag data, Landtage, elections, and further political coverage.

## Context Rot

Context rot destroys intelligence, so every word in CLAUDE.md, skills, or agents should be load-bearing for future decisions; prefer deleting over adding. Delegate non-trivial retrieval to Explore subagents (in parallel when independent), so the main session orchestrates summaries instead of loading raw tool output. `CLAUDE.md` is public, checked-in project knowledge: anything concise and project-related belongs here so it's shared with all collaborators.

## VPS Dev URL

On the development VPS, `https://dev.machtblick.de` points through the named `machtblick-dev` Cloudflare tunnel to Vite on port 5174. The preview is noindexed and not for public sharing. After a VPS reboot, run `npx vite dev --port 5174 --host` in `apps/bundestag` and `cloudflared tunnel --config ~/.cloudflared/machtblick-dev.yml run`. A 530/1033 response means the tunnel daemon is down.

## Code Style

### General

- **Less is more.** Prefer deleting over adding; if it isn't load-bearing, remove it
- **No comments.** No inline, no docstrings, no headers
- **No em dashes, in any variant.** Not U+2014, not U+2013, not spaced double hyphen as a typed substitute, not anywhere. Reach for commas, parentheses, line breaks, or periods instead. Hyphens in compound words, CLI flags (`--port`), and CSS custom properties (`--color-fg`) are unrelated and fine
- **No try-catch** unless explicitly requested; let errors propagate
- **No single-use variables or functions.** Inline the expression. Confirm before extracting new helpers
- **No large files.** Split aggressively; a filename is a promise about what's inside, placing a new file should be mechanical
- **Happy path only.** Structure code around doing the work, positive conditionals, no early returns or failure-first guards
- **Ternary for simple conditionals**
- **Default parameters over null checks** when possible
- **Explicit imports, no wildcards**
- **One component or view per file**
- **Predictability over file count.** Folder describes the role, file names mechanical
- **Design truth lives in this file's Design section.** ASCII sketches are design-time scaffolding, made during a redesign, deleted when the view ships. No standing .mock.md files
- **No absolute filesystem paths in checked-in files.** Scripts, configs, agent definitions, and docs use repo-relative paths so the project works for anyone who clones it
- **Fix data, not symptoms.** When app logic has to compensate for messy data (server-side flips, regex fallbacks, "if X then invert Y"), the fix belongs in ETL or a one-shot DB normalization script under `db/`, not in the read path. Derived public-data fields that humans may review, like titles, mappings, classifications, and labels, must be materialized through ETL or SQL before the app reads them. Document the quirk inline in `.claude/agents/plumber.md` (per-source section) so it doesn't get rediscovered. Hacks in app code rot; clean data scales.
- **LLM work in ETL goes through local agent CLIs, not provider APIs.** Prefer `codex exec` because Codex credits are plentiful; use `claude -p --model sonnet --output-format json` only when a task explicitly needs Claude. For enrichment steps that need a model (title simplification, classification, summarization, parsing fallbacks), shell out with the prompt on stdin and parse strict JSON from stdout or an output file. Loop locally with concurrency control; no SDK, no API keys in code.

### Web

- **Views are presentational; logic lives in hooks.** A view that calls `useQuery` is a bug. Routes are thin glue composing a view with its hooks
- **Type-safe end to end.** Frontend imports types from server; never restate them
- **TanStack first.** Router, Query, Table, Form, before reaching for alternatives
- **Every route must prerender.** We ship to Cloudflare Pages with `spa: false`. Any path not in `apps/<app>/build/prerenderPaths.ts` (imported by `vite.config.ts`) falls back to the root `index.html`, which has no dehydrated loader data. New dynamic segment or new nested tab → add it to `prerenderPaths()` in the same change. Child routes that read a parent's loader (`useLoaderData({ from: '<parent>' })`) must guard with `?? defaultValue` because on a cold prerender-fallback hit the parent loader hasn't resolved yet.
- **Server functions only run at build time.** On Cloudflare Pages with `spa: false`, `createServerFn(...)` handlers execute during prerender and their results are dehydrated into the HTML; at runtime `/_serverFn/...` returns the SPA fallback. A view needing data from a server fn must trigger it from a route `loader` and read with `Route.useLoaderData()`. **Never call a server function from `useQuery`** (works locally, returns HTML in prod, crashes downstream on JSON parse). Lazy data → put the loader on a sub-route so it only fires when that route is active.

### iOS

- **SwiftUI views are presentational; logic lives in stores.** Feature UI belongs under `UI/`; loading, filtering, and persistent state belong in `@Observable` stores under `Logic/`

## Design

Use shared tokens before adding one-off values. Exceptions belong inside shared primitives, not individual call sites.

| Token | Scale |
|---|---|
| Text size | `xxl/xl/l/m/s` = 24/22/16/14/12. Display numerals use Fraunces semibold at 32 or 40px with `tabular-nums` for results, seats, and statistics |
| Font weight | UI uses `regular` (400) and `semibold` (600). Rendered prose may preserve bold and italic |
| Font roles | Fraunces (`font-display`, semibold) for titles and display numerals. Lora for summary prose. System sans for all other UI |
| Icon size | `s/m/l/xl` = 14/17/19/26 |
| Spacing | `xs/s/m/l/xl` = 4/8/12/16/24 |
| Radius | `s/m/l` = 8/14/20. Contained surfaces and controls generally use `m`, stamps use `s`, floating controls use pills, and edge-to-edge feed surfaces stay square |
| Stroke | `s/m/l` = 1/1.5/2 px |
| Opacity | `s/m/l` = 0.15/0.4/0.7 |
| Palette | `background`, `surface`, `elevated`, and `fg` adapt to the active theme |
| Accents | Shared named accents plus semantic `success` and `danger`. Party colors use the shared palette |

- Primary editorial cards use `background` without elevation shadows. Borders and radius follow the surface; overlays, floating controls, and selected tab controls may use shadow
- Vote outcomes use semantic colors: Ja `success`, Nein `danger`, Enthaltung `yellow`, and theme-adaptive neutrals for absence
- The hemicycle is the canonical result visualization, with one dot per seat and absences visible. Party breakdowns use mini donuts sorted from highest Ja share to lowest, with mixed parties labeled semibold
- Vote-feed summaries render generated markdown as Lora prose with a fitted line clamp, and the full card is the link. On web, one responsive component serves all breakpoints
- Meta and captions use `text-s`, uppercase, 0.08em letter spacing, and `opacity-l`
- Primary feeds have no visible masthead or page title
- Hierarchy comes from size and spacing, not weight inflation
- Party color identifies parties. Result and stance colors communicate outcomes
- Compact proposer kickers render the party logo alone and use text for non-parties
- Borders are `text @ opacity-s`, not a new gray

## Team

The main session orchestrates: it holds the full picture, delegates execution to specialists via the Agent tool (briefing each like a smart colleague with goal, constraints, exact paths, and the plan file to read and log to), verifies their work by reading the actual files, and integrates. Specialists share no context with each other; plan files are the only durable channel between sessions and subagents, carrying goal, status, shared contracts, open questions, and an append-only log per agent. Every change starts with a plan in `plans/NN-slug.md`, small or big. Codex sessions have standing permission to spawn these specialists; their `.codex/agents/*.toml` are generated from `.claude/agents/*.md` via `npm run agents:sync`, edit the source, never the toml.

| Agent | Owns |
|----------|---------|
| plumber  | ETL, `db/schema/`, source quirks |
| backend  | API, exported router types |
| frontend | React + TanStack views and hooks |
| tester | Browser verification before deploys that change user-visible behavior |
| deployer | Cloudflare deploys, pre-deploy visibility checks; only when explicitly asked |
| designer | Summoned for redesign rounds; throwaway sketches, never standing docs |

## Commits

Conventional Commits: type(scope): imperative subject under 72 chars, no trailing period, no em dashes. Scope is the app or area (`feat(bundestag):`, `chore(db):`). Body only when the why is not obvious from the diff. Stage with explicit paths, never `git add -A`. One logical change per commit; a plan under `plans/` must cover the work. Commit and push only when the operator asks.
