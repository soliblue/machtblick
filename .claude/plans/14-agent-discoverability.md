# 14 — Agent / crawler discoverability pass

## Goal

Make machtblick.de legible to LLM agents, search crawlers, and human power-users without breaking the static-only deploy model. Ship the highest-leverage items only; defer or reject the rest (see §Out of scope).

## In scope (ordered by impact)

### 1. JSON endpoints alongside HTML

Generated at build time inside `apps/bundestag/vite.config.ts` (next to the existing `writeSpeechesStatic()` — same pattern, same hook).

| Endpoint | Contents | Source |
|---|---|---|
| `/votes/{id}.json` | Same shape the vote detail route consumes (header, party breakdown, member rolls, debate). Reuse the loader's data. | Existing route loader logic |
| `/members/{slug}.json` | Member header + voting record + speeches + Anfragen. | Existing member route loader |
| `/parties/{slug}.json` | Party header + members + voting summary. | Existing party route |
| `/api/votes.json` | One file. All non-procedural votes, lean fields (`{id, title, date, result, party_totals}`). No pagination — one fetch beats N. | Single SQL query |
| `/api/members.json` | All members, lean (`{id, name, party, slug, photo_url}`). | Single SQL query |
| `/api/parties.json` | All parties, lean. | Single SQL query |

Each detail HTML page emits in `<head>`:

```html
<link rel="alternate" type="application/json" href="/votes/{id}.json">
```

Use TanStack Router's `head` hook to inject per-route.

### 2. JSON-LD structured data

Inject `<script type="application/ld+json">` via per-route `head` hook.

| Page type | Schema | Why |
|---|---|---|
| Member detail | `Person` with `affiliation` (party), `jobTitle: "Mitglied des Deutschen Bundestages"`, `worksFor: { @type: GovernmentOrganization, name: "Deutscher Bundestag" }`, `birthPlace`, `image` | Standard, well-recognized |
| Party detail | `Organization` with `member` array (URIs to MP pages), `numberOfEmployees` (seat count), `logo` | Standard |
| Vote detail | **Skip.** schema.org has no good type for parliamentary roll-calls. Faking `Article` / `Dataset` does more harm than good. Rely on the JSON endpoint + clean `<meta>` tags. | Don't invent schemas |

Validate Person/Organization output with Google's Rich Results test before shipping.

### 3. `robots.txt` with explicit AI allowances

Replace `apps/bundestag/public/robots.txt`:

```
User-agent: *
Allow: /
Sitemap: https://machtblick.de/sitemap.xml

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /
```

### 4. Extend `llms.txt`

Append to existing `apps/bundestag/public/llms.txt`:

```
## JSON API
- /api/votes.json — alle Abstimmungen (lean)
- /votes/{id}.json — einzelne Abstimmung mit Details
- /api/members.json — alle Mitglieder
- /members/{slug}.json — einzelnes Mitglied
- /api/parties.json — alle Fraktionen
- /parties/{slug}.json — einzelne Fraktion
```

### 5. `_headers` for caching

Create `apps/bundestag/public/_headers`:

```
/*.json
  Cache-Control: public, max-age=3600, s-maxage=86400

/_build/*
  Cache-Control: public, max-age=31536000, immutable

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*
  Cache-Control: public, max-age=3600, s-maxage=86400
```

Note: **JSON for entities that can change is NOT immutable.** Only fingerprinted assets (`/_build/abc.js`) get `immutable`. The original prompt got this wrong.

### 6. Canonical URLs + trailing-slash hygiene

Pick one convention. We currently prerender `path/` (trailing slash). Stick with that.

- All `<link rel="canonical">` tags must point to the trailing-slash form.
- Add `_redirects` entries to 301 non-trailing-slash variants to the canonical form.
- Lowercase everywhere (party slugs already are; double-check member slugs).

### 7. Accessibility baseline

| Check | Fix |
|---|---|
| Party SVGs have `alt` / `aria-label` | Add `aria-label={"Logo der " + partyName}` to `PartyLogo` component |
| Buttons + interactive elements have ARIA labels | Sweep `FilterPill`, sort headers, expand triggers |
| Heading hierarchy is sequential | Audit each route; fix skips |
| Color contrast ≥ 4.5:1 | Run axe-core; if any text uses `opacity-s` (0.15) on light bg, bump it |
| Lighthouse a11y ≥ 95 | Audit run; fix only critical/serious items |

## Out of scope

| Item | Why rejected/deferred |
|---|---|
| Per-page OG images | Generating ~1,000 PNGs adds file count + build time, and we just escaped the 20k cap. Revisit later with on-demand Worker (Satori) — that breaks "static only" so it's its own plan. |
| Pagefind/Lunr search | We already shipped substring search with German-compound semantics (plan 13). Pagefind would downgrade UX: "kanzler" stops finding Bundeskanzler. Don't replace working code with worse code. |
| Per-entity changelog (`/changes.json`) | We don't snapshot history. Requires `vote_history`, `member_snapshot` tables + diff worker. Its own project, not part of SEO pass. |
| RSS / Atom feed | Low impact — Bundestag publishes its own. Cheap to ship if someone asks. Skip until requested. |
| `Vote` JSON-LD | No good schema.org type. Faking `Article` adds noise. |
| Lighthouse perf 95+ as a goal | Worth running as audit; not worth chasing the exact number. Fix only what's broken. |

## Contracts

- All new endpoints reuse data already loaded by existing route loaders. Don't duplicate SQL — extract a shared `apps/bundestag/vite-data/` helper module with one function per entity that returns the canonical record. Both the route loader (via tree-shaken import) and the JSON writer call into it.
- TanStack Router's per-route `head` hook is where the JSON-LD + `<link rel=alternate>` go. Don't inject globally.
- `_headers` and `_redirects` are Cloudflare Pages native formats — keep them in `public/` so Pages picks them up automatically.

## Acceptance

| Check | How |
|---|---|
| `/votes/2026-01-29-992-bundeswehreinsatz-gegen-den-islamischen-staat.json` returns valid JSON | curl |
| `/api/votes.json` lists all non-procedural votes | curl, count rows |
| Detail HTML has `<link rel="alternate" type="application/json" …>` | view-source |
| Member page has valid `Person` JSON-LD that passes Google Rich Results test | rich-results.google.com |
| `robots.txt` lists GPTBot/ClaudeBot/PerplexityBot/Google-Extended | curl |
| `llms.txt` documents the new endpoints | curl |
| `_headers` applied (DevTools shows `Cache-Control` on JSON) | curl -I |
| Lighthouse a11y ≥ 95 on `/`, `/votes/`, a vote detail, a member detail, `/parties/spd/` | Lighthouse CLI |
| File count still well under 20k | `find apps/bundestag/public -type f \| wc -l` |
| No file over 25 MiB | `find apps/bundestag/public -type f -size +25M` empty |

## Status

- todo: lead — assign workstreams.

## Suggested workstream split

1. **plumber/backend**: extract `vite-data/` shared loaders. (One commit.)
2. **frontend**: wire `head` hooks for `<link rel=alternate>` + JSON-LD on member/party routes. (One commit.)
3. **frontend**: write the JSON endpoints into `vite.config.ts`. (One commit.)
4. **frontend**: a11y sweep + canonical/trailing-slash + `_headers` + `_redirects` + `llms.txt` + `robots.txt`. (One commit — they're all small.)

## Log

(append notes here as workstreams land)
