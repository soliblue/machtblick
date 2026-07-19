Machtblick is a collection of small apps that use public German datasets to inform the public. Each app is self-contained inside `apps/`, shares utilities via the root, never reaches into another app. Live surfaces: `https://machtblick.de` (web) and the iOS app on the App Store at `https://apps.apple.com/us/app/machtblick/id6787755187` (link this everywhere, not TestFlight; the beta phase is over).

## Memory, Context Rot and Agents

Context rot destroys intelligence, so every word in CLAUDE.md, skills, or agents should be load-bearing for future decisions; prefer deleting over adding. Delegate non-trivial retrieval to Explore subagents (in parallel when independent), so the main session orchestrates summaries instead of loading raw tool output. `CLAUDE.md` is public, checked-in project knowledge: anything concise and project-related belongs here so it's shared with all collaborators.

## Repo layout

```
machtblick/
  apps/
    bundestag/        # transparency platform for Bundestag votes, members, parties
      build/          # build-time generators: prerender paths, sitemap, feeds, JSON endpoints
      src/views/      # presentational only; no fetching, no business logic
      src/components/ # shared presentational pieces used across views
      src/hooks/      # TanStack Query hooks, derived state, business logic
      src/routes/     # TanStack Router file-based routes; thin glue
      src/server/     # API server functions; owns exported router types
      src/lib/        # app-local types and utilities
  db/                 # Drizzle schema (db/schema/), migrations, normalization scripts
  etl/                # Node importers, one folder per upstream source, plus _shared and _oneshot
  .claude/
    agents/           # source specialist instructions
  plans/              # numbered plan files (00-, 01-, ...) for multi-agent work
```

## Dev URL

Live preview of the local checkout is at `https://dev.machtblick.de`, served by a named cloudflared tunnel pointed at `vite dev`. Noindexed (`robots: noindex, nofollow` is injected when `import.meta.env.DEV`), not for sharing. Use it to verify changes on a phone or share a screenshot with the operator before deploying to `machtblick.de`. Bring-up after a reboot: `npx vite dev --port 5174 --host` in `apps/bundestag`, and `cloudflared tunnel --config ~/.cloudflared/machtblick-dev.yml run` (named tunnel `machtblick-dev`; a 530/1033 on the public URL means the daemon is down, just rerun it).

## Code Style

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
- **One component per file**
- **Predictability over file count.** Folder describes the role, file names mechanical
- **Views are presentational; logic lives in hooks.** A view that calls `useQuery` is a bug. Routes are thin glue composing a view with its hooks
- **Type-safe end to end.** Frontend imports types from server; never restate them
- **TanStack first.** Router, Query, Table, Form, before reaching for alternatives
- **Design truth lives in this file's Design section.** ASCII sketches are design-time scaffolding, made during a redesign, deleted when the view ships. No standing .mock.md files
- **No absolute filesystem paths in checked-in files.** Scripts, configs, agent definitions, and docs use repo-relative paths so the project works for anyone who clones it
- **Fix data, not symptoms.** When app logic has to compensate for messy data (server-side flips, regex fallbacks, "if X then invert Y"), the fix belongs in ETL or a one-shot DB normalization script under `db/`, not in the read path. Derived public-data fields that humans may review, like titles, mappings, classifications, and labels, must be materialized through ETL or SQL before the app reads them. Document the quirk inline in `.claude/agents/plumber.md` (per-source section) so it doesn't get rediscovered. Hacks in app code rot; clean data scales.
- **LLM work in ETL goes through local agent CLIs, not provider APIs.** Prefer `codex exec` because Codex credits are plentiful; use `claude -p --model sonnet --output-format json` only when a task explicitly needs Claude. For enrichment steps that need a model (title simplification, classification, summarization, parsing fallbacks), shell out with the prompt on stdin and parse strict JSON from stdout or an output file. Loop locally with concurrency control; no SDK, no API keys in code.
- **Every route must prerender.** We ship to Cloudflare Pages with `spa: false`. Any path not in `apps/<app>/build/prerenderPaths.ts` (imported by `vite.config.ts`) falls back to the root `index.html`, which has no dehydrated loader data. New dynamic segment or new nested tab → add it to `prerenderPaths()` in the same change. Child routes that read a parent's loader (`useLoaderData({ from: '<parent>' })`) must guard with `?? defaultValue` because on a cold prerender-fallback hit the parent loader hasn't resolved yet.
- **Server functions only run at build time.** On Cloudflare Pages with `spa: false`, `createServerFn(...)` handlers execute during prerender and their results are dehydrated into the HTML; at runtime `/_serverFn/...` returns the SPA fallback. A view needing data from a server fn must trigger it from a route `loader` and read with `Route.useLoaderData()`. **Never call a server function from `useQuery`** (works locally, returns HTML in prod, crashes downstream on JSON parse). Lazy data → put the loader on a sub-route so it only fires when that route is active.

## Design

Tokens are fixed. Reach for one of these before inventing a value.

| Token | Scale |
|---|---|
| Text size | `xxl/xl/l/m/s` = 24/22/16/14/12. One sanctioned exception: poster numerals, `font-display` semibold 32px+ `tabular-nums`, big result counts only |
| Font weight | `regular` (400), `semibold` (600). Only two, ever |
| Font roles | Fraunces (`font-display`, semibold) = titles and poster numerals. Charter serif = summary prose. System sans = all other UI |
| Icon size | `s/m/l/xl` = 14/17/19/26 |
| Spacing | `xs/s/m/l/xl` = 4/8/12/16/24 |
| Radius | 0. Sharp corners everywhere. The `s/m/l` = 8/14/20 scale and the full pill exist only for floating controls (e.g. the mobile filter button) |
| Stroke | `s/m/l` = 1/1.5/2 px |
| Opacity | `s/m/l` = 0.15/0.4/0.7 |
| Palette (light, default) | `background` = white, `surface` = subtle off-white, `elevated` = slightly darker. Three shades total |
| Accents | Fixed 16-name set + `success` + `danger`. Party colors map onto this set, never bespoke |

The card language, settled in plan 102 on `/votes/`; every remaining view converges on it:

- Cards are white (`background`) with a 1px `text @ opacity-s` border, no shadow (user removed all card shadows 2026-07-05; shadows only on true overlays like the Reader sheet), radius 0, padding `l`
- Verdict/status rides the top edge: 3px top border in the status color, a small semibold uppercase white chip in the same color straddling it, centered. Text always straight, never rotated
- Vote result colors: Ja `success`, Nein `danger`, Enthaltung `yellow` (neutral `fg @ opacity-m` inside the hemicycle dot mass), Abwesend faint `fg @ opacity-s`
- The hemicycle is the canonical result viz (one dot = one seat, absences visible); per-party breakdown = mini donut row sorted Ja-share left to Nein-share right, mixed party = semibold label
- Summaries are real generated markdown rendered as serif prose with a fitted line clamp; the whole card is one stretched link
- Meta and captions: `text-s` uppercase, letter-spacing 0.08em, `opacity-l`
- One component, both devices: mobile = full-viewport snap-feed card, desktop = the same component reflowed into columns via responsive classes. Never a second design per breakpoint
- Mobile primary action floats bottom center as a full pill (`fg` fill, `background` text, lucide funnel, active count) opening a bottom sheet; desktop keeps the sticky FilterPill row. Feeds have no masthead or visible h1

Rules:

- Hierarchy comes from size and spacing, not weight inflation
- Color is meaning, not decoration. Accent = party / result / status; party color is identity only, never stats or charts
- Proposer renders as the party logo alone (plain text for non-parties), never logo plus name
- Borders are `text @ opacity-s`, not a new gray
- If you reach for `padding: 10px` you're wrong

Banned, user-rejected AI tells (do not re-propose): left-edge accent rails or stripes, rotated stamps on list surfaces (the Stamp is a detail-page device, straight when inline), gray or `surface` card backgrounds, mastheads or page titles on feed pages, a third font weight, bespoke grays.

UI primitives come from shadcn/ui, restricted to the curated set: Button, Input, Select, Combobox, Card, Badge, Table, Tabs, Tooltip, Skeleton. Adding anything else is a decision, not a default.

## Team

The main session orchestrates: it holds the full picture, delegates execution to specialists via the Agent tool (briefing each like a smart colleague with goal, constraints, exact paths, and the plan file to read and log to), verifies their work by reading the actual files, and integrates. Specialists share no context with each other; plan files are the only durable channel between sessions and subagents, carrying goal, status, shared contracts, open questions, and an append-only log per agent. Every change starts with a plan in `plans/NN-slug.md`, small or big.

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
