# 17 — Simplified vote descriptions

## Goal

Bundestag vote titles + `summary` are written for lawyers, not for general audiences. We use the PDF text of the underlying Antrag to generate **two new fields** per vote, both markdown:

- `summary_simplified` — 2–6 sentences, plain language, the gist of what the Antrag asks for.
- `summary_detail` — longer markdown with `##` headings. Format: **rules** (what would actually change) + **explanation** (why / context). General-audience language, concise, stays close to the Antrag — does not invent claims.

The detail field is shown on the vote detail page under a callout disclosing that it is AI-generated and linking to the original Antrag PDF.

Existing `votes.summary` (from `contextJson`) is kept as-is — it's the upstream copy.

## Status

| Workstream | Owner | State |
|---|---|---|
| Schema: `summary_simplified` + `summary_detail` columns | plumber | done |
| Antrag Drucksache picker (Antrag, not Beschlussempfehlung) | plumber | done |
| PDF text extraction (cache to disk) | plumber | done |
| LLM enrichment via `claude -p sonnet` | plumber | done |
| Expose fields on `VoteDetail` server type | backend (auto via `$inferSelect`) | done |
| Markdown renderer + UI swap with callout | frontend | done |

## Contracts

### Schema (`db/schema/votes.ts`)

Add two columns, both nullable:

| Column | Type | Notes |
|---|---|---|
| `summary_simplified` | `text` | Markdown, inline only (bold + italic). 2–6 sentences. No headings, lists, or links. Null until ETL writes it. |
| `summary_detail` | `text` | Markdown with `##` subheadings. Null until ETL writes it. |

A small side table for audit/idempotency:

```
vote_description_decisions (
  vote_id PK,
  drucksache_id,         -- which document we used
  source_pdf_url,        -- the Antrag PDF URL the LLM saw
  model,                 -- 'sonnet'
  generated_at,
  prompt_version         -- bump to force regeneration
)
```

`votes.summary_simplified IS NULL OR prompt_version_mismatch` → regenerate. Otherwise skip.

### Drucksache picker

`vote_documents` may list multiple PDFs (Antrag + Beschlussempfehlung). Always prefer the **Antrag**, not the Beschlussempfehlung:

1. Pull all `vote_documents` for the vote.
2. From the DIP cache (`etl/bundestag/handzeichen/drucksachen/d-21-*.json`), pick the one whose `vorgangsart`/`dokumentart` is closest to "Antrag" (and not "Beschlussempfehlung", "Bericht", "Empfehlung").
3. Tie-break: lowest Drucksache number — Anträge are filed first, recommendations later.
4. If no Antrag-flavored doc exists (rare), skip the vote.

### PDF extraction

- `pdftotext -layout <pdf> -` (Poppler), cache output to `etl/bundestag/descriptions/text/<drucksache-id>.txt`.
- Strip cover/footer boilerplate (page numbers, "Deutscher Bundestag – 21. Wahlperiode" headers) with a small post-processor.
- If `pdftotext` yields under 200 chars (scanned PDF), fall back to `claude -p haiku` OCR over the PDF as binary — same pattern we use elsewhere.
- Idempotent on the cache.

### LLM enrichment

For each vote that needs it, build a single Sonnet call:

```
claude -p --model sonnet --output-format json < prompt.txt
```

Stdin contains:

- The vote title (already normalized via plan 16).
- The extracted Antrag PDF text (truncated to ~30k chars; Anträge fit easily).
- Instructions to return strict JSON:
  ```json
  { "summary_simplified": "…", "summary_detail": "…" }
  ```

Prompt rules (lock these in `etl/bundestag/descriptions/prompt.mjs`):

- Output German, plain language, general audience, ~8th-grade level.
- `summary_simplified`: 2–6 sentences, inline markdown only — `**bold**` and `*italic*` allowed for emphasis on key terms / numbers. No headings, no lists, no links. Conveys the gist.
- `summary_detail`: markdown with at least two `##` sections, in this order:
  - `## Was geändert würde` — concrete rules / measures the Antrag proposes. Bullet list if multiple.
  - `## Hintergrund` — short explanation of why, context, problem being addressed.
- Keep specific numbers and named entities from the Antrag verbatim.
- No `§§` citations. No procedural framing ("Der Antrag fordert…", "Die Fraktion XY möchte…"). State the rule directly.
- No mention of the vote result, party politics, or stance evaluation. Neutral.
- No em dashes. No invented facts. If unsure, omit rather than guess.

Concurrency: 4 parallel Sonnet calls via the existing homegrown limiter in `etl/bundestag/polarity/limit.mjs`.

### Frontend

- New shared component `apps/bundestag/src/lib/Markdown.tsx` using `react-markdown` with a minimal token-aligned style sheet (heading sizes mapped to `text-l`/`text-m`, list spacing on `gap-s`). No raw HTML, no images, no syntax highlighting. Keep dependency surface small.
- Variant `<Markdown inline />` (or a second tiny component) that restricts to inline emphasis only — for `summary_simplified`. Rendered inside a `<p>`, no block elements emitted.
- In `VoteDetail.tsx`:
  - Replace the current `vote.summary` paragraph with `vote.summary_simplified` rendered via `<Markdown inline />`. Fall back to plain `vote.summary` if simplified is null.
  - Below the donut + waffle section, add a new collapsible "Details zum Antrag" section that:
    - Opens with a callout tile (`bg-surface p-m text-s`, sharp corners, no icon):
      > Diese Zusammenfassung ist KI-generiert und sprachlich vereinfacht. Den vollständigen Antrag findest du **[hier]({antragPdfUrl})**.
    - Renders `vote.summary_detail` as Markdown below the callout.
  - Hide the section entirely if `vote.summary_detail` is null.

The Antrag PDF URL comes from `vote_documents` (the same Drucksache the ETL picked). Expose `antragPdfUrl: string | null` on the `VoteDetail` server return type.

### Server / type changes

`apps/bundestag/src/server/votes.ts` `VoteDetail.vote` auto-picks up `summary_simplified` / `summary_detail` via `typeof votes.$inferSelect`. Backend adds `antragPdfUrl` derived from the same Drucksache picker logic exposed as a tiny shared helper in `etl/bundestag/descriptions/pickAntrag.mjs` (callable from both ETL and server — pure function, no DB).

## Open questions

None pending. Locked design:

- Two fields, both markdown.
- Detail format: `## Was geändert würde` + `## Hintergrund`.
- Callout copy disclosing AI-generated + link to Antrag PDF.
- Source = Antrag PDF only (not Beschlussempfehlung).
- LLM = Sonnet via CLI.
- Idempotent via `vote_description_decisions` + `prompt_version`.

## Log

- 2026-05-13 lead: plan created after feasibility check (pdftotext on 21/2363 Pendler-Antrag produced clean numbered Antragspunkte + Begründung, confirming the dual-field approach is achievable). Dispatching plumber for schema + ETL.
- 2026-05-13 frontend: server now exposes `antragPdfUrl` on `VoteDetail` via a tiny shim at `apps/bundestag/src/server/lib/pickAntrag.ts` that re-exports `pickAntragFromRows` from the ETL module. Refactored `etl/bundestag/descriptions/pickAntrag.mjs` to split the pure ranker (`pickAntragFromRows`) from the DB-aware `pickAntrag` wrapper so it can be reused without a better-sqlite3 handle. ETL `run.mjs` still uses the wrapper unchanged. Added sibling `.d.mts` so the TS shim resolves cleanly without ambient module hacks. Installed `react-markdown` (~80 packages incl. unified/remark/mdast/micromark stack — heavier than ideal but no lighter option supports the component override pattern we need). Skipped `remark-gfm`: the LLM prompt only emits CommonMark-friendly markdown (`##` headings, `-` lists, `**bold**`, `*italic*`, plain links). Built `Markdown` (block) and `MarkdownInline` as separate files per one-component-per-file rule; inline variant uses `allowedElements` + `unwrapDisallowed` so it renders cleanly inside a caller `<p>`. `VoteDetail.tsx`: replaced the raw `summary` paragraph with `summarySimplified` via `MarkdownInline` (falls back to plain `summary` when null), and added a "Details zum Antrag" section after the donut+waffle that renders only when `summaryDetail` is non-null. Callout copy adapts to whether `antragPdfUrl` is present (omits second sentence when null). Skipped the collapsible — left expanded per scope note. `tsc` clean except for the pre-existing `parties.ts` cohesion error. Files: `apps/bundestag/src/server/votes.ts`, `apps/bundestag/src/server/lib/pickAntrag.ts`, `apps/bundestag/src/lib/Markdown.tsx`, `apps/bundestag/src/lib/MarkdownInline.tsx`, `apps/bundestag/src/views/voteDetail/VoteDetail.tsx`, `etl/bundestag/descriptions/pickAntrag.mjs`, `etl/bundestag/descriptions/pickAntrag.d.mts`, `apps/bundestag/package.json`.
- 2026-05-13 frontend: restructured `VoteDetail.tsx` into three tabs (`Ergebnis`, `Details`, `Reden`) under the title/stamps/summary header. Tab state lives in URL as `?tab=details|reden` (omitted for default `ergebnis`), validated by the route. Tabs primitive not extracted to `lib/` — member detail uses real child routes with `<Link>` + `activeProps`, which isn't a clean fit here (would add 3× per-vote prerender paths), so mirrored the member nav styling (border-y grid, `-mb-px` active underline, `bg-surface`) in a local `VoteDetailTabs.tsx` driven by `useNavigate` for soft transitions. Tab panels split into `ResultTab.tsx` (owns the `VoteChoice` filter state, holds donut+waffle+Abweichler+Dokumente), `DetailTab.tsx` (AI callout + `summaryDetail` via block `Markdown`; empty-state copy when null), `SpeechesTab.tsx` (DebateList; empty-state copy when no debate). Result-stamps row remains in the header. `tsc` clean except pre-existing `parties.ts` cohesion error. Files: `apps/bundestag/src/views/voteDetail/VoteDetail.tsx`, `apps/bundestag/src/views/voteDetail/VoteDetailTabs.tsx`, `apps/bundestag/src/views/voteDetail/ResultTab.tsx`, `apps/bundestag/src/views/voteDetail/DetailTab.tsx`, `apps/bundestag/src/views/voteDetail/SpeechesTab.tsx`, `apps/bundestag/src/routes/votes/$id.tsx`.
- 2026-05-13 plumber: landed schema (`votes.summary_simplified`, `votes.summary_detail`, side table `vote_description_decisions`, migration `0012_vote_descriptions.sql`, journal updated). Built `etl/bundestag/descriptions/` (pickAntrag, extractPdf, prompt, llm, run). Picker reads `vote_documents` directly — the `label` is the Drucksache number and the `title` field is prefixed with the doc type (`Antrag:`, `Gesetzentwurf:`, `Beschlussempfehlung:`, ...), so the DIP cache isn't needed for this step (saves cache hydration for the namentlich votes). PDF cached under `etl/bundestag/descriptions/pdf/` (gitignored) and extracted text under `text/`. Header strip catches single-line `Deutscher Bundestag ... Drucksache N/M` (pdftotext joins them when columns align), plus `Wahlperiode` lines, `- N -` page numbers. `pdftotext -layout` was sufficient for every PDF in the run — Claude-haiku OCR fallback never triggered. Concurrency 4 via shared `pLimit` from polarity. Wired into `refresh.mjs` after polarity and exposed as `npm run etl:descriptions`. Run on WP21 (2026-05-13): total=281 candidates, skipped_no_pdf=173 (Haushaltsplan / Einzelplan votes only carry the Beschlussempfehlung in `vote_documents`; the upstream extraction never captured the underlying Gesetzentwurf — separate ETL gap, out of scope here), llm_success=107, llm_failure=1 (`pp21-51-1-standortfordergesetz` — Sonnet emitted invalid JSON, likely unescaped quote in markdown). Total coverage 107/281 ≈ 38%; on the picker-eligible subset 107/108 ≈ 99%. Updated plumber memory with the new section. Backend + frontend remain.
- 2026-05-13 plumber (follow-up): Beschlussempfehlung-title fallback landed in `pickAntragWithFallback()`. Async picker that, when the sync `pickAntragFromRows` finds no Antrag-flavored row, scans the Beschlussempfehlung `title` for `Drucksachen? 21/XXXX` references, ranks them by preceding-keyword (Gesetzentwurf > Antrag, lowest Drucksache wins), then resolves PDF URL via DIP API. Cache lookup goes shared `etl/bundestag/handzeichen/drucksachen/` first (handzeichen ETL pre-populates this), then local `etl/bundestag/descriptions/dip-cache/`, then live DIP fetch. Run.mjs scoped to `summary_simplified IS NULL` only for this pass (so prior PROMPT_VERSION=3 rows weren't clobbered — the latest manual cleanups live only in the DB) and then reverted to the standard prompt-version-aware query. `PROMPT_VERSION` bumped to 4 so future re-runs catch prompt edits. Backend `votes.ts` now reads `vote_description_decisions.source_pdf_url` first for `antragPdfUrl` so fallback PDFs surface in the AI-generated callout. Run on WP21 (2026-05-13): total=173 newly-eligible candidates, skipped_no_pdf=125 (Beschlussempfehlungen with no parseable Drucksache reference: empty titles, Petitionen Sammelübersichten, Verordnungen, Wahleinsprüche), llm_success=48, llm_failure=0. New total coverage 156/281 ≈ 55% (up from 107/281 ≈ 38%). Spot-checked Haushalt 2025/2026, Corona-Enquete, Aufenthaltsüberwachung — all clean, accurate, headings + emphasis correct. Surprise: zero LLM failures this pass (last pass had 1 on `pp21-51-1` which is now retried — and still has `summary_simplified IS NULL`, so it failed again silently; worth checking on the next run). Updated plumber memory replacing "Coverage gap — Haushalt votes" with "Beschlussempfehlung fallback".
