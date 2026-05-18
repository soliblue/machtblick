# SEO Sharing AI Review

Status: Completed

Goal: Review and improve Bundestag app SEO, social sharing previews, favicon and app icons, and AI crawler readability for ChatGPT, Claude, Gemini, and similar assistants.

Shared contracts:

- Changes stay inside `apps/bundestag` unless a repo-level file is clearly required.
- Metadata should work for German and English routes.
- Shared previews should include title, description, canonical URL, and a stable image.
- AI access should be explicit through robots rules and lightweight machine-readable guidance.
- Every implemented change must be verified by build or targeted inspection.

Open questions:

- None.

Log:

- lead, 2026-05-18: Started SEO, sharing, favicon, and AI optimization pass after user requested full review and implementation.
- lead, 2026-05-18: Reviewed current guidance from Open Graph, Google Search Central, OpenAI crawler docs, Anthropic crawler docs, and X card docs.
- lead, 2026-05-18: Added a stable 1200 by 630 share image at `apps/bundestag/public/og-image.png`, with SVG source at `apps/bundestag/public/og-image.svg`.
- lead, 2026-05-18: Extended `seoMeta()` with Open Graph image fields, X card image fields, image alt text, locale alternates, and lower-case `hreflang` canonical alternates.
- lead, 2026-05-18: Fixed the root sitemap link, added production robots preview directives, set the Open Graph HTML prefix, and expanded structured data to Organization, WebSite, DataCatalog, and Dataset nodes.
- lead, 2026-05-18: Updated `robots.txt`, `llms.txt`, `_headers`, `.well-known/api-catalog`, and the web manifest so crawlers, assistants, and shared links can discover the right pages and JSON endpoints while preserving the existing no-training content signal.
- lead, 2026-05-18: Ran `npm run build -w @machtblick/bundestag`. Client, SSR, and prerender completed successfully.
- lead, 2026-05-18: Inspected generated HTML for `og:image`, `twitter:image`, canonical links, `hreflang` links, robots preview directives, sitemap link, structured data, and English motion JSON alternates.
- lead, 2026-05-18: Verified `og-image.png` is 1200 by 630 and 72381 bytes, JSON metadata files parse, and changed text files contain no en dash or em dash characters.
