Machtblick is a collection of small apps that use public German datasets to inform the public. Each app is self-contained inside `apps/`, shares utilities via the root, never reaches into another app.

## Memory, Context Rot and Agents

Context rot destroys intelligence, so every word in CLAUDE.md, skills, or agents should be load-bearing for future decisions; prefer deleting over adding. Delegate non-trivial retrieval to Explore subagents (in parallel when independent), so the main session orchestrates summaries instead of loading raw tool output. `CLAUDE.md` is public, checked-in project knowledge: anything concise and project-related belongs here so it's shared with all collaborators.

## Repo layout

```
machtblick/
  apps/
    bundestag/        # transparency platform for Bundestag votes, members, parties
      src/views/      # presentational only; no fetching, no business logic
      src/hooks/      # TanStack Query hooks, derived state, business logic
      src/routes/     # TanStack Router file-based routes; thin glue
      src/server/     # API server functions; owns exported router types
      src/lib/        # app-local types and utilities
  packages/
    ui/               # shared primitives, added only when a second app needs them
  db/                 # Drizzle schema and migrations, shared across apps
  etl/                # Node workers, one folder per upstream source, run on cron
  .claude/
    agents/           # lead + designer + plumber + backend + frontend
    plans/            # numbered plan files (00-, 01-, ...) for multi-agent work
```

## Code Style

- **Less is more.** Prefer deleting over adding; if it isn't load-bearing, remove it
- **No comments.** No inline, no docstrings, no headers
- **No em dashes.** Anywhere, including code, commits, and generated text
- **No try-catch** unless explicitly requested; let errors propagate
- **No single-use variables or functions.** Inline the expression. Confirm before extracting new helpers
- **No large files.** Split aggressively; a filename is a promise about what's inside, placing a new file should be mechanical
- **Happy path only.** Structure code around doing the work, positive conditionals, no early returns or failure-first guards
- **Ternary for simple conditionals**
- **Default parameters over null checks** when possible
- **Explicit imports, no wildcards**
- **One component per file**
- **Predictability over file count.** Folder describes the role, file names mechanical
- **Views are presentational; logic lives in hooks.** A view that calls `useQuery` is a bug. Routes are thin glue composing a view with its hooks
- **Type-safe end to end.** Frontend imports types from server; never restate them
- **TanStack first.** Router, Query, Table, Form, before reaching for alternatives
- **ASCII mocks are the source of truth for layout intent.** Commit at `apps/<app>/src/views/<view>/<view>.mock.md`
- **No absolute filesystem paths in checked-in files.** Scripts, configs, agent definitions, and docs use repo-relative paths so the project works for anyone who clones it
- **Fix data, not symptoms.** When app logic has to compensate for messy data (server-side flips, regex fallbacks, "if X then invert Y"), the fix belongs in ETL or a one-shot DB normalization script under `db/`, not in the read path. Document the quirk inline in `.claude/agents/plumber.md` (per-source section) so it doesn't get rediscovered. Hacks in app code rot; clean data scales.

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
- If you reach for `padding: 10px` you're wrong

UI primitives come from shadcn/ui, restricted to the curated set: Button, Input, Select, Combobox, Card, Badge, Table, Tabs, Tooltip, Skeleton. Adding anything else is a decision, not a default.

## Team

`lead` is the default session persona. Specialists dispatched via the Agent tool.

| Agent | Owns |
|----------|---------|
| designer | ASCII mocks, IA |
| plumber  | ETL, `db/schema.ts` |
| backend  | API, exported router types |
| frontend | React + TanStack views and hooks |

Every new app or big feature starts with a plan in `.claude/plans/NN-slug.md`. The plan is the only durable channel between subagents, so it carries the goal, status, shared contracts, open questions, and an append-only log per agent. Small fixes don't need a plan.
