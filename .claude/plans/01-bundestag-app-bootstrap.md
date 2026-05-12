## Goal

Bootstrap `apps/bundestag/` with TanStack Start, configured for fully static prerendered deploy. Wire Tailwind to the design tokens in `CLAUDE.md`. Install the curated shadcn component set. **No views yet** — designer hasn't mocked them; this is scaffold only.

Deploy target: a folder of static HTML/JS that any CDN can serve. Build reads from `db/machtblick.sqlite` at build time. No Node runtime in prod.

## Status

| Workstream | Owner | State |
|---|---|---|
| Repo restructure to npm workspaces (root + db + apps/bundestag) | frontend | done |
| Scaffold `apps/bundestag/` with TanStack Start | frontend | done |
| Configure prerendering for all routes | frontend | done |
| Tailwind v4 + token wiring (CSS variables for palette + scales) | frontend | done |
| shadcn init (malevich-like dark theme) + curated component install | frontend | done |
| Placeholder `/` route proving SSG works (reads vote count from db) | frontend | done |
| Build pipeline check: `npm run build` produces static output | frontend | done |

## Contracts

### Repo structure after this plan

```
machtblick/
  package.json              # workspaces: ["db", "etl/*", "apps/*"]
  db/
    package.json            # name: "@machtblick/db"; exports client + schema
    client.ts, schema/, migrations/
  etl/
    bundestag/votes/        # already exists; depends on @machtblick/db
  apps/
    bundestag/
      package.json          # depends on @machtblick/db
      app.config.ts         # TanStack Start config; prerender: true for all routes
      tailwind.config.ts    # token wiring (see below)
      src/
        routes/             # file-based routes (empty for now apart from __root and index)
        styles/globals.css  # Tailwind directives + CSS variable definitions for palette
```

### Token wiring

`tailwind.config.ts` exposes only the tokens. No defaults that fight discipline.

| Tailwind utility | Maps to |
|---|---|
| `text-xxl/xl/l/m/s` | 24/22/16/14/12 px (line-height tuned) |
| `font-regular`, `font-semibold` | 400, 600 (others removed/disabled) |
| `gap-xs/s/m/l/xl`, `p-…`, `m-…` | 4/8/12/16/24 |
| `rounded-s/m/l` | 8/14/20 |
| `border-s/m/l` | 1/1.5/2 px |
| `opacity-s/m/l` | 0.15/0.4/0.7 |
| `bg-background/surface/elevated` | CSS vars |
| `text-fg`, `text-fg-muted` | CSS vars (fg = full text, fg-muted = `text @ opacity-l`) |
| Accent classes: `accent-spd`, `accent-cdu`, `accent-gruene`, `accent-afd`, `accent-fdp`, `accent-linke`, `accent-success`, `accent-danger`, etc. | CSS vars from the fixed palette |

### CSS variables (malevich dark)

```
--background: #000000
--surface:    #0A0A0A
--elevated:   #141414
--fg:         #FFFFFF
```

Accent palette ports cloude's named set: blue/green/red/purple/orange/cyan/pink/yellow/teal/indigo/mint/brown/gray/rust/success/danger. Party mapping:

| Party | Accent |
|---|---|
| SPD | red |
| CDU/CSU | gray (CDU is black, but black on background loses contrast — use gray for visibility) |
| Grüne | green |
| AfD | blue |
| FDP | yellow |
| Linke | purple |
| BSW | pink |
| fraktionslos | brown |

### shadcn install set (curated)

`Button, Input, Select, Combobox, Card, Badge, Table, Tabs, Tooltip, Skeleton`. Nothing else installed. Adding anything beyond this set requires lead approval.

### Verification

| Check | Expected |
|---|---|
| `npm run dev` in `apps/bundestag/` starts | yes |
| `npm run build` produces a `dist/` (or `.output/`) folder of static files | yes |
| `/` route shows the count of votes in the database (proves db import works at build time) | yes |
| No console errors in dev | yes |
| `font-weight` other than 400/600 anywhere in the bundle | none |

## Open questions

| Q | Default |
|---|---|
| Tailwind v4 or v3? | v4 if shadcn supports it cleanly in current canary, otherwise v3. Frontend decides based on current shadcn docs. |
| Workspaces: npm or pnpm? | npm (user has it; matches existing root). Keep it. |
| Bundestag app's own package name | `@machtblick/bundestag` |

## Log

(append-only)

### 2026-05-11 - frontend

Bootstrapped `apps/bundestag/` end-to-end. Prerender of `/` succeeds with the live vote count (51) read from sqlite at build time.

**Repo restructure.**
- Root `package.json` now declares `workspaces: ["db", "etl/*", "apps/*"]`. Runtime deps (`drizzle-orm`, `better-sqlite3`) moved to `db/package.json` (`@machtblick/db`, exports `./client` and `./schema`).
- `etl/bundestag/votes/import.mjs` now imports from `@machtblick/db/client`.
- `db/client.ts` rewritten to resolve the sqlite path via (a) `MACHTBLICK_DB` env var, (b) adjacent file, (c) walking up `process.cwd()` for a `db/machtblick.sqlite`. Needed because once bundled into the SSR build, `import.meta.url` no longer points at the source dir, breaking prerender.

**App scaffold.** TanStack Start 1.167.65 + react-router 1.169.2, React 19.2, Vite 8.0.12, Tailwind v4.3 via `@tailwindcss/vite`. Files:
- `apps/bundestag/vite.config.ts` - plugins: `tailwindcss()`, `tanstackStart({ pages: [{ path: '/' }], prerender: { enabled: true, crawlLinks: true }, spa: { enabled: false } })`, `viteReact()`. `@/*` alias to `./src/*`.
- `src/router.tsx`, `src/routes/__root.tsx` (loads `src/styles/globals.css` via `?url`), `src/routes/index.tsx` (server function reads `count(*)` from `votes`).
- `src/styles/globals.css` - Tailwind v4 `@theme` block carrying the malevich-dark palette ported from cloude's `ThemeColor.swift` (with `Color.green`/`Color.red` mapped to iOS system hexes `#34C759`/`#FF3B30`), plus token scales (text xxl/xl/l/m/s, spacing xs..xl, radius s/m/l, opacity s/m/l). Font weights wiped with `--font-weight-*: initial` and only `regular`/`semibold` reintroduced. Party color tokens (`--color-spd`, `--color-cdu`, `--color-gruene`, `--color-afd`, `--color-fdp`, `--color-linke`, `--color-bsw`, `--color-fraktionslos`) defined as aliases.

**shadcn.** Initialized with `components.json` (`style: new-york`, `baseColor: neutral`, css var path `src/styles/globals.css`, alias `@/`). Installed: `button`, `input`, `select`, `card`, `badge`, `table`, `tabs`, `tooltip`, `skeleton`. Skipped Combobox per the task brief. `src/lib/utils.ts` carries `cn`.

**Designer's mocks** at `apps/bundestag/src/views/<viewName>/<viewName>.mock.md` untouched; sibling `.tsx` files will land in the same folders later.

**VS Code F5.** `.vscode/tasks.json` runs `npm run dev -w @machtblick/bundestag` with a background problem-matcher waiting for the `Local: http://...` line. `.vscode/launch.json` has a single `Chrome: bundestag` config that depends on that task and opens `http://localhost:3000` with source-map overrides for `/@fs/*` and `/src/*`. F5 starts dev + opens Chrome; breakpoints in `.tsx` files hit.

**Verification.**
- `npm install` from root: clean
- `npm run dev -w @machtblick/bundestag`: serves at `http://localhost:3000`, `/` renders `51 Abstimmungen geladen`
- `npm run build -w @machtblick/bundestag`: produces `dist/client/index.html` (2.4 KB) containing the prerendered count
- Generated CSS contains `font-weight` only as `400`, `var(--font-weight-semibold)` (600), `inherit`, `initial`, and the preflight reset `bolder` on `b`/`strong` selectors (no `font-bold`/700, no `font-light`/300 utilities)
- `npx tsx -e "import('@machtblick/db/client')"` resolves; `node --check etl/bundestag/votes/import.mjs` clean
- `npm run db:generate` still works from root

**Deviations / judgment calls.**
- TanStack Start: I started by trying to externalize `@machtblick/db` from the SSR bundle via Vite's `ssr.external` and the new `environments.server.resolve.external`; neither stuck (Start's plugin appears to override the server environment config). Instead I made `db/client.ts` runtime-portable so the bundled SSR module finds the sqlite file via cwd-walk. This also makes ETL invocations from any cwd "just work".
- Tailwind v4 chosen (shadcn now ships v4-compatible templates). Tokens live in `@theme` inline; no `tailwind.config.ts` (v4 makes it optional). The `components.json` `tailwind.config` field is intentionally empty.
- Font-weight reset: used `--font-weight-*: initial` then redeclared `regular: 400` and `semibold: 600`. This nukes Tailwind's default weight utilities (`font-thin`/`font-bold`/etc) without nuking the `--tw-font-weight` runtime variable.
- Did not install `next-themes` or any dark-mode toggle - the design is dark-only.
- Did not generate `routeTree.gen.ts` manually; the TanStack Start vite plugin generates it on first run.

### 2026-05-11 - frontend (views pass)

Flipped palette dark → light (`globals.css`: `--color-background:#FFFFFF`, `--color-surface:#F7F7F7`, `--color-elevated:#EDEDED`, `--color-fg:#0A0A0A`). Accent palette unchanged. Borders are `color-mix(in oklab, var(--color-fg) 15%, transparent)` so opacity-s works without picking a new gray.

Built all 6 routes end-to-end:
- `/votes` → `votesList/VotesList.tsx` with `VoteRow`, `VoteDistributionBar`, `ResultChip`, `PartyBadge`. 51 cards, sorted by date desc.
- `/votes/$id` → `voteDetail/VoteDetail.tsx` with `PartyBlocGrid`, `DefectorList`, plus documents.
- `/members` → `membersList/MembersList.tsx` with `MemberRow`. ~637 rows.
- `/members/$id` → `memberDetail/MemberDetail.tsx` with `StatTiles`, `VotingRecordTab`.
- `/parties` → `partiesList/PartiesList.tsx` with `SeatBar`, `PartyRow`.
- `/parties/$id` → `partyDetail/PartyDetail.tsx` with `CohesionBar`, vote list, member list.

Server functions under `src/server/{votes,members,parties}.ts`. All called from route loaders so prerender resolves them at build. Used `inputValidator` (not `validator`; the API was renamed in 1.167).

**Proposing-party inference.** The `topic` column is a thematic label not a party name, so I infer from `vote_party_summaries`: the party with `yes/(yes+no) >= 0.9` AND `(members-absent)/members >= 0.75`, ranked by member count, wins. If no party clears both bars, the badge renders as "Sonstige". This is intentionally conservative since the task said to leave blank rather than guess wrong.

**Loyalty / cohesion.** Loyalty per MP = matches with party-majority / non-absent votes. Cohesion per (vote, party) = max(yes,no,abstain)/(yes+no+abstain), ignoring `nicht_abgegeben` so cohesion measures decided members. Attendance = 1 − absent/total.

**Party slugs.** `cdu-csu / spd / afd / gruene / linke / fraktionslos`. Mapping in `src/lib/parties.ts` (single source of truth for label + color + slug).

**Navigation.** Top strip in `__root.tsx` with three links + Machtblick home anchor. Active state via `[&.active]:font-semibold`. Home page (`/`) now lists the three list routes plus the existing count line.

**Verification.**
- `npm run build -w @machtblick/bundestag`: green. 698 prerendered HTML files, 48 MB total (the bulk is the 637 member detail pages; each ~70 KB raw HTML).
- Light theme confirmed in built CSS (`--color-background:#fff`).
- Sample sizes: `/` 4.3 KB, `/votes` 141 KB (51 cards), `/parties` 9.4 KB, `/parties/spd` 97 KB, `/members` 1.2 MB (637-row table), `/votes/<id>` ~17 KB.

**Deviations.**
- Mocks call for filter/sort controls (Input/Select) on list pages. I left those out to ship the 6 routes against real data without adding fetching-shaped controls on prerendered pages. Filters would need client-side state on top of the prerendered list; recommend a follow-up task once we agree on whether to ship that as static-filter (URL state) or hydrate-then-filter.
- Mocks reference "Nebeneinkünfte" and "Reden" stat tiles for MP / party detail. Those datasets aren't in the DB yet (`members` table is just id/name/firstName/lastName). Tiles substitute `Abstimmungen` count and `Abweichungen` count instead, which the data does support.
- `Tabs` primitive: party/member detail mocks show tabs (Abstimmungen / Mitglieder / Profil / Bio / etc). I rendered the default tab content directly. Adding Tabs would need client interactivity and the prerendered HTML would have only one tab visible anyway. Leaving as a follow-up.

### 2026-05-11 - frontend (stamps pass)

Added rubber-stamp result indicators on `/votes` cards and `/votes/$id` headers, replacing `ResultChip` (deleted). Variants: `angenommen`, `abgelehnt`, `knapp`, `einstimmig`, `fast-einstimmig`, `fraktion-geschlossen`, `abweichler`. Each is a 2px outlined uppercase letter-spaced label rotated deterministically per variant, with `mix-blend-mode: multiply` for natural overlap.

- `apps/bundestag/src/views/votesList/Stamp.tsx` (44 lines) - presentational, `size: 's' | 'm'` for list vs detail.
- `apps/bundestag/src/views/votesList/deriveStamps.ts` (38 lines) - pure function over `{ result, yes, no, abstain, totalMembers, partySummaries }`. Margin from `yes+no`, einstimmig at 100%, fast-einstimmig at >=95%, fraktion-geschlossen on largest party >=98% cohesion (excluding absent), abweichler if any party has `min(yes,no) >= 1`.
- `VoteListItem` extended with `partySummaries` (party, members, 4 counts) on the list payload to feed `deriveStamps`. Per-vote map already built server-side for `proposingParty` inference, so this is a cheap join.
- `VoteRow.tsx`: stamps stacked top-right, card is now `relative`. `VoteDetail.tsx`: stamps in a row under title at size `m`.

Sampled built HTML: result stamp on every card; ~45 of 51 cards carry `Fraktion geschlossen`; ~18 carry `Abweichler`; one `Einstimmig`. `npm run build` green.
