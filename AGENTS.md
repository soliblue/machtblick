Machtblick is a collection of small apps that use public German datasets to inform the public. Each app is self-contained inside `apps/`, shares utilities via the root, never reaches into another app.

## Codex Session Role

Session prefix: subagents are allowed and preferred. This is the user's standing request for Codex to spawn specialist subagents when project instructions call for them or when delegation materially helps.

Root Codex sessions act as `lead`: hold the full picture, create or update the plan first, coordinate specialist work, and integrate by reading files instead of trusting summaries.

Use `.codex/agents/*.toml` for spawned specialist agents. There is no Codex `lead` subagent because the root session is lead.

Specialists:

| Agent | Owns |
|---|---|
| designer | ASCII mocks, IA |
| plumber | ETL, `db/schema.ts` |
| backend | API, exported router types |
| frontend | React + TanStack views and hooks |
| tester | Browser verification |
| launcher | Local dev server bring-up |
| visibility | SEO, sharing previews, crawler and AI assistant discoverability |
| renamer | Conversation names |
| archiver | Conversation archive and unarchive actions |
| deployer | Cloudflare deploys only when explicitly asked |
| scribe | Git commits |

Every change starts with a plan in `plans/NN-slug.md`, small or big. The plan is the durable channel between sessions and subagents, so it carries the goal, status, shared contracts, open questions, and an append-only log per agent.

## Conversation Names and Archives

Lead should call `renamer` after the first substantive user message, after about the fifth user message, and whenever the user asks if the current name still fits. Renamer considers the conversation context and uses one emoji plus at most two words.

Lead may call `archiver` only when the user asks to archive or unarchive a conversation, or when lead gives explicit target thread ids for completed spawned threads. Archiver requires target thread ids and must not guess from recency. Archiver must not archive the active root thread unless the user explicitly asks.

## Memory and Context

Codex memories are local recall, not project truth. Do not rely on `.claude/agent-memory/*` in Codex sessions.

Durable knowledge goes in one of these places:

- `AGENTS.md` for concise Codex-facing project rules
- `CLAUDE.md` for concise Claude-facing project rules
- `.claude/agents/*.md` for specialist source instructions, then run `npm run agents:sync`
- `plans/NN-slug.md` for work-specific contracts and logs

Context rot destroys intelligence. Every word in instructions, skills, agents, and plans should be load-bearing. Prefer deleting over adding.

## Repo Layout

```
machtblick/
  apps/
    bundestag/        # transparency platform for Bundestag votes, members, parties
      src/views/      # presentational only, no fetching, no business logic
      src/hooks/      # TanStack Query hooks, derived state, business logic
      src/routes/     # TanStack Router file-based routes, thin glue
      src/server/     # API server functions, owns exported router types
      src/lib/        # app-local types and utilities
  packages/
    ui/               # shared primitives, added only when a second app needs them
  db/                 # Drizzle schema and migrations, shared across apps
  etl/                # Node workers, one folder per upstream source, run on cron
  .claude/
    agents/           # source agent instructions
  .codex/
    agents/           # generated Codex specialist agents
    config.toml       # Codex project config
  plans/              # neutral numbered plan files (00-, 01-, ...)
```

## Dev URL

Live preview of the local checkout is at `https://dev.machtblick.de`, served by a named cloudflared tunnel pointed at `vite dev`. Noindexed (`robots: noindex, nofollow` is injected when `import.meta.env.DEV`), not for sharing. Use it to verify changes on a phone or share a screenshot with the operator before deploying to `machtblick.de`. Bring-up commands and tunnel metadata are machine-specific and stay out of checked-in docs.

## Code Style

- **Less is more.** Prefer deleting over adding. If it is not load-bearing, remove it
- **No comments.** No inline, no docstrings, no headers
- **No em dashes, in any variant.** Not U+2014, not U+2013, not spaced double hyphen as a typed substitute, not anywhere. Reach for commas, parentheses, line breaks, or periods instead. Hyphens in compound words, CLI flags (`--port`), and CSS custom properties (`--color-fg`) are unrelated and fine
- **No try-catch** unless explicitly requested. Let errors propagate
- **No single-use variables or functions.** Inline the expression. Confirm before extracting new helpers
- **No large files.** Split aggressively. A filename is a promise about what is inside
- **Happy path only.** Structure code around doing the work, positive conditionals, no early returns or failure-first guards
- **Ternary for simple conditionals**
- **Default parameters over null checks** when possible
- **Explicit imports, no wildcards**
- **One component per file**
- **Predictability over file count.** Folder describes the role, file names mechanical
- **Views are presentational, logic lives in hooks.** A view that calls `useQuery` is a bug. Routes are thin glue composing a view with its hooks
- **Type-safe end to end.** Frontend imports types from server. Never restate them
- **TanStack first.** Router, Query, Table, Form, before reaching for alternatives
- **ASCII mocks are the source of truth for layout intent.** Commit at `apps/<app>/src/views/<view>/<view>.mock.md`
- **No absolute filesystem paths in checked-in files.** Scripts, configs, agent definitions, and docs use repo-relative paths
- **Fix data, not symptoms.** When app logic has to compensate for messy data, the fix belongs in ETL or a checked-in DB normalization script under `db/`, not in the read path. No invisible one-off database edits: every data correction must be reproducible for the next refresh, either by updating the importer or by adding an idempotent checked-in normalization or migration script and referencing it from the plan. Derived public-data fields that humans may review, like titles, mappings, classifications, and labels, must be materialized through ETL or SQL before the app reads them
- **LLM work in ETL goes through local agent CLIs, not provider APIs.** Prefer `codex exec`; use `claude -p --model sonnet --output-format json` only when a task explicitly needs Claude
- **Every route must prerender.** New dynamic segment or nested tab means updating `apps/<app>/vite.config.ts > prerenderPaths()` in the same change
- **Server functions only run at build time.** A view needing data from a server fn must trigger it from a route `loader` and read with `Route.useLoaderData()`. Never call a server function from `useQuery`

## Design

Tokens are fixed. Reach for one of these before inventing a value.

| Token | Scale |
|---|---|
| Text size | `xxl/xl/l/m/s` = 24/22/16/14/12 |
| Font weight | `regular` (400), `semibold` (600). Only two, ever |
| Icon size | `s/m/l/xl` = 14/17/19/26 |
| Spacing | `xs/s/m/l/xl` = 4/8/12/16/24 |
| Radius | `s/m/l` = 8/14/20 |
| Stroke | `s/m/l` = 1/1.5/2 px |
| Opacity | `s/m/l` = 0.15/0.4/0.7 |
| Palette (light, default) | `background` = white, `surface` = subtle off-white, `elevated` = slightly darker. Three shades total |
| Accents | Fixed 16-name set + `success` + `danger`. Party colors map onto this set, never bespoke |

Rules:

- Hierarchy comes from size and spacing, not weight inflation
- Color is meaning, not decoration. Accent = party / result / status
- Borders are `text @ opacity-s`, not a new gray
- If you reach for `padding: 10px` you are wrong

UI primitives come from shadcn/ui, restricted to the curated set: Button, Input, Select, Combobox, Card, Badge, Table, Tabs, Tooltip, Skeleton. Adding anything else is a decision, not a default.
