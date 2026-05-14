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

### 7. Link response headers (RFC 8288)

Add to `_headers` on `/`:

```
/
  Link: </.well-known/api-catalog>; rel="api-catalog", </llms.txt>; rel="service-doc"
```

Points agents at the API catalog and llms.txt from the homepage response itself.

Docs: https://www.rfc-editor.org/rfc/rfc8288

### 8. Markdown for Agents (Cloudflare native)

Cloudflare Pages supports `Accept: text/markdown` content negotiation out of the box. Enable via `wrangler.jsonc` or dashboard. When an agent sends `Accept: text/markdown`, Cloudflare returns a markdown rendering of the HTML page automatically.

Docs: https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/

### 9. Content Signals in robots.txt

Append to robots.txt:

```
Content-Signal: search=yes, ai-input=yes, ai-train=no
```

We want agents to read and cite our data, but not train on it.

Docs: https://contentsignals.org/

### 10. API catalog (RFC 9727)

Serve `/.well-known/api-catalog` as a static JSON file (`application/linkset+json`):

```json
{
  "linkset": [
    {
      "anchor": "https://machtblick.de/",
      "service-desc": [{ "href": "/api/votes.json", "type": "application/json" }],
      "service-doc": [{ "href": "/llms.txt", "type": "text/plain" }]
    }
  ]
}
```

Lists all our JSON endpoints for programmatic discovery. Needs a `_headers` entry to set the correct content type.

Docs: https://www.rfc-editor.org/rfc/rfc9727

### 11. Accessibility baseline

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
| Homepage response has `Link` header with `rel="api-catalog"` | curl -I |
| `/.well-known/api-catalog` returns valid `application/linkset+json` | curl |
| `robots.txt` contains `Content-Signal:` directive | curl |
| `Accept: text/markdown` returns markdown on deployed site | curl -H 'Accept: text/markdown' |

## Status

| Step | Owner | State |
|---|---|---|
| 1. Extract `vite-data/` shared loaders | backend | done |
| 2. JSON endpoints in `vite.config.ts` | backend | done |
| 3. `head` hooks: `<link rel=alternate>` + JSON-LD (member/party) | frontend | done |
| 4. `robots.txt` + Content Signals + `llms.txt` update | frontend | done |
| 5. `_headers` (caching + Link headers) | frontend | done |
| 6. `/.well-known/api-catalog` (RFC 9727) | frontend | done |
| 7. Markdown for Agents (Cloudflare config) | frontend | todo |
| 8. Canonical URLs + trailing-slash `_redirects` | frontend | done |
| 9. a11y sweep (ARIA, headings, contrast) | frontend | done |

## Log

- **lead**: updated plan with 4 new agent discoverability items from isitagentready.com feedback (Link headers, Markdown for Agents, Content Signals, API catalog). Dropped OAuth, MCP, WebMCP, agent-skills as not applicable to a static read-only site.
- **backend**: created `vite-data/` module (votes.ts, members.ts, parties.ts) with lean + full query functions. Wired `writeJsonEndpoints()` into vite.config.ts generating /api/*.json and per-entity *.json files. Added generated paths to .gitignore.
- **frontend**: shipped static discovery files: updated robots.txt with Content-Signal, appended JSON API section to llms.txt, created _headers (caching + Link response headers), _redirects (trailing-slash 301s), .well-known/api-catalog (RFC 9727).
- **frontend**: added <link rel="alternate" type="application/json"> to all three detail routes. Enhanced member JSON-LD with worksFor and image. Enhanced party JSON-LD with QuantitativeValue seats and member array. Removed incorrect Article JSON-LD from vote detail per plan.
- **frontend**: a11y sweep complete. PartyLogo now exposes alt text (decorative prop for cases next to party name). FilterPill/MemberFilterPill clear buttons got aria-label + keyboard handler, dropdowns got role=listbox/option + aria-expanded. SortHeader buttons got aria-label. VoteDistributionDonut, Hemicycle, StatPie SVGs got role=img + aria-label. Added sr-only h1 to VotesList, MembersList, PartiesList, RedenSearch. No opacity-s contrast issues found on text.
