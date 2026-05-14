# 23 — Legal pages (Impressum + Datenschutz)

## Goal

Add the two legal pages required for a German public-facing site:

- `/impressum` — lightweight, no personal address. Positions the project as the work of one German citizen using AI to build government-transparency tools.
- `/datenschutz` — short. We collect no personal data; nothing to disclose beyond that.

Linked from a footer reachable on every route.

## Content

### Impressum (`/impressum`)

Sections, in order:

1. **Was ist Machtblick** — single German citizen using AI to build tools that make the work of the Bundestag and government accessible. No commentary, no political position, not activism. Just turning public sources into a user-friendly interface for the average citizen.
2. **Datenquellen** — list with links and what we use from each:
   - **Deutscher Bundestag — Stammdaten** — bundestag.de — MP master data
   - **Deutscher Bundestag — Plenarprotokolle** — dserver.bundestag.de — plenary speeches and protocols
   - **Deutscher Bundestag — Parlamentaria** — bundestag.de — party donation disclosures (>50.000 €)
   - **DIP — Parlamentsinformationssystem** — search.dip.bundestag.de — parliamentary requests (Anfragen) and signatories
   - **abgeordnetenwatch.de** — MP profiles, portraits, faction affiliation changes
   - **Wikidata** — query.wikidata.org — MP portrait references (P18) — CC0
   - **Wikimedia Commons** — commons.wikimedia.org — portrait image files (licenses vary per file, stored alongside)

   None of the Bundestag-owned sources publish an explicit machine-readable license. Frontend to add a note: "Quellen ohne explizite Lizenzangabe sind öffentlich zugängliche Daten des Deutschen Bundestages." Wikimedia attribution per image follows the license stored with the file.
3. **Grundsätze** — no commentary, no bias toward any group, not activists, just easier access to information from sources made available by great people.
4. **Kontakt**:
   - Fragen: `hello@machtblick.de`
   - Feedback: `feedback@machtblick.de`
   - Mitmachen: `mitmachen@machtblick.de`
5. **Zur Person** — short note: for privacy reasons we don't list the operator's name or address here. May change if the site gains real traction.

### Datenschutz (`/datenschutz`)

One paragraph: this site collects no personal data. No analytics, no cookies, no tracking, no accounts, no forms. Contact emails are only used to answer the message sent.

**Audit result (2026-05-14):** Clean except for one finding — `globals.css` loads the Fraunces font from `fonts.bunny.net`. Bunny CDN sees visitor IPs on font fetch. Under DSGVO this counts as third-party data processing. Two options:

- **A (preferred):** self-host Fraunces. Drop the bunny.net `@import`, ship the woff2 files in `public/fonts/`, declare with `@font-face`. Then the "no data collection" claim holds without disclaimer.
- **B:** keep bunny.net and disclose it in `/datenschutz` ("Diese Seite lädt die Schriftart Fraunces von fonts.bunny.net. Dabei wird Ihre IP-Adresse an den Bunny-CDN-Server übertragen. ...").

Default to A. Frontend to swap the font loading as part of this plan.

## Contracts

- Routes: `apps/bundestag/src/routes/impressum.tsx`, `datenschutz.tsx`
- Views: `apps/bundestag/src/views/impressum/`, `views/datenschutz/` with `.mock.md` next to each
- Footer component lives in `apps/bundestag/src/views/_layout/` (or wherever the current root layout lives — frontend to confirm)
- Both paths added to `prerenderPaths()` in `apps/bundestag/vite.config.ts`

## Status

- [x] audit — third-party requests: clean except `fonts.bunny.net` (see Datenschutz section). Data sources catalogued.
- [x] designer — ASCII mocks for both pages + footer placement
- [x] frontend — self-host Fraunces (drop bunny.net), implement routes/views, footer link, add to `prerenderPaths()`

## TODO outside this plan

- Provision mailboxes for `hello@`, `feedback@`, `mitmachen@` at `machtblick.de`. Pages will publish these addresses before they're guaranteed to receive.

## Open questions

(none — Stand-date is hard-coded "14. Mai 2026", updated by hand on substantive legal-content changes only.)

## Log

- 2026-05-14 — lead: plan created from user brief.
- 2026-05-14 — lead: decisions locked — `mitmachen@machtblick.de`, footer sitewide, mailbox provisioning tracked as out-of-band TODO. Running audit (third-party requests + data source attribution) before dispatching designer.
- 2026-05-14 — lead: audit complete. Third-party finding: `fonts.bunny.net` import in `globals.css` — recommend self-hosting Fraunces. Data sources: 8 upstreams identified (Bundestag Stammdaten, Plenarprotokolle, Parlamentaria, DIP, abgeordnetenwatch, Wikidata, Wikimedia Commons). No explicit licenses on Bundestag sources; Wikimedia per-image. Plan content fully spec'd, ready for designer.
- 2026-05-14 — designer: produced three mocks. `views/impressum/impressum.mock.md` — single-column prose, 5 sections, Datenquellen grouped (Bundestag / abgeordnetenwatch / Bilder). `views/datenschutz/datenschutz.mock.md` — single paragraph + Stand-date, assumes Option A (Fraunces self-hosted); fallback paragraph spec'd if frontend keeps bunny.net. `views/nav/footer.mock.md` — placed footer mock under `nav/` (which already owns sitewide chrome) rather than a new `_layout/` view; thin tagline + two legal links, one top border matching the nav's bottom border, lives in `__root.tsx` after `<Outlet />`. No new components introduced — all three pages are plain prose/markup, no Card/Badge/Tabs. Decision worth flagging: section captions use the house `text-s uppercase opacity-l` style on Impressum, but Datenschutz has no section captions at all (intentional — brevity is the design statement).
- 2026-05-14 — frontend: Option A shipped. Self-hosted Fraunces 600 + 700 (latin + latin-ext, woff2 only) under `apps/bundestag/public/fonts/`, declared via `@font-face` with `font-display: swap` in `globals.css`, dropped the `fonts.bunny.net` `@import`. Skipped Vietnamese subset (German-only site, ~17KB saved). No Option B fallback needed. Files created: `src/views/nav/Footer.tsx`, `src/views/impressum/Impressum.tsx`, `src/views/datenschutz/Datenschutz.tsx`, `src/routes/impressum.tsx`, `src/routes/datenschutz.tsx`. Wired `<Footer />` after `<Outlet />` in `__root.tsx`. `prerenderPaths()` now includes `/impressum/` and `/datenschutz/` (trailing slashes to match the rest of the app and TanStack's generated route tree). Surprise: TanStack's router-plugin normalizes file routes to trailing-slash form, so route ids became `/impressum/` and `/datenschutz/` and Link `to=` props had to match. `npx vite build` succeeds and both pages are crawled and prerendered. The one pre-existing TS error in `src/server/parties.ts` (cohesion nullability) is unrelated to this plan.
