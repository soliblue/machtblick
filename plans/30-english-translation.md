# 30 — English translation

## Goal

Offer the whole bundestag app in English so a non-German-speaking visitor can navigate votes, members, parties, debates and Anfragen. German stays default. A clearly visible toggle in the header switches between the two. We do **not** translate the original Drucksachen PDFs — that scope blows up the LLM budget and the originals are linked anyway. Everything we already store as German text in the DB gets a side-by-side English column, generated once by `claude -p sonnet` over the CLI (his subscription, no API spend).

## Status

| Workstream | Owner | State |
|---|---|---|
| Routing: `/en/...` prefix, language detection, hreflang | frontend | done |
| UI string layer (`de.json` / `en.json`) | frontend | done |
| Schema: translation tables for votes, party summaries and speeches | plumber | done |
| ETL: batched Codex translation runners | plumber | done |
| Backend: pass through English fields and pick by request locale | backend | done |
| Language switcher | frontend | done |

## Approach

### Routing — path prefix, not cookie

- `/en/...` mirrors every existing path. `/votes/abc/` ↔ `/en/votes/abc/`.
- Prerender both halves: `prerenderPaths()` in `apps/bundestag/vite.config.ts` returns each path twice. Current set is ~5k paths → ~10k. Build time roughly doubles, still under the Cloudflare Pages 20k limit.
- A single `useLocale()` hook reads the leading segment. No cookie, no localStorage — URL is the source of truth so a shared link opens in the right language.
- Header switcher: a small `EN / DE` pill that swaps the prefix in the current `location.pathname` and navigates.
- `<html lang>` follows the prefix.
- Sitemap emits both halves with `<xhtml:link rel="alternate" hreflang="...">` pairs so Google understands the relationship.

### UI strings

- New folder `apps/bundestag/src/i18n/` with `de.ts` and `en.ts`, each a flat object of keys → string. Keys grouped by view, e.g. `votes.filters.party`, `voteDetail.tabs.result`.
- A tiny `t(key)` hook that picks the dict based on `useLocale()`. No date-fns locale juggling beyond what we already do; if a number/date needs formatting we already write that inline.
- Initial inventory: scan every JSX literal in `src/views/` and `src/components/` and seed `de.ts`. Mechanical first pass, no clever extraction tooling.
- This is the only piece a human (or LLM) translates manually — small surface, high-quality bar.

### Data translation — what we cover, in priority order

Priority 1 — required for listing pages to be usable in English:

| Surface | Fields | Volume |
|---|---|---|
| `votes` | `title`, `clean_title`, `summary`, `summary_simplified`, `summary_detail` | 300 rows × 5 fields |
| `antraege` | `title`, `abstract` (and whatever else the row carries) | 833 rows |
| `anfragen` | `title` only | 8,418 rows |
| `members` | role labels, biography fields if any | ~750 rows, mostly names so this is nearly free |
| `vote_party_summaries` (after plan 31 lands) | `position_summary`, `key_points` | ~250 rows |

Priority 2 — heavier, optional for v1:

| Surface | Fields | Volume |
|---|---|---|
| `speeches` | `text_full` | 25,463 rows, ~4.4M words |
| `anfragen_answer_text` | full answer body | 8,418 rows, similar order |

Recommendation: ship Priority 1 first. Add a feature flag so the `/en/` speech and Anfrage-detail pages either show the German original with a clear "Original text — not yet translated" banner, or hide the English route entirely. Translate speeches in a background pass once the rest is in production.

### Schema

Per table, mirror the translatable columns with an `_en` suffix. All nullable:

```
votes:        title_en, clean_title_en, summary_en, summary_simplified_en, summary_detail_en
antraege:     title_en, abstract_en
anfragen:     title_en
speeches:     text_full_en, text_excerpt_en          (Priority 2)
vote_party_summaries: position_summary_en, key_points_en  (after plan 31)
```

Audit table `translations_decisions` for idempotency, mirroring `vote_description_decisions`:

```
translations_decisions (
  source_table, source_id, source_column PK,
  model,
  prompt_version,
  generated_at
)
```

Bump `prompt_version` to force a refresh of a whole class without truncating columns.

### ETL — `etl/translate/`

One generic runner. Reads pending rows from a target table/column set, batches them, builds a single Sonnet prompt per batch, parses strict JSON back.

- Batching rules:
  - Short fields (titles, simplified summaries): 20 per call. Stays under 4k input tokens.
  - Medium fields (`summary_detail`, antrag abstracts): 5 per call.
  - Long fields (speech `text_full`): 1 per call, split if a single speech exceeds ~20k tokens.
- Prompt locked under `etl/translate/prompt.mjs`. Rules:
  - Translate German → English faithfully, no summarization, no commentary.
  - Preserve markdown structure (headings, lists, `**bold**`, `*italic*`) for fields that carry markdown.
  - Keep proper nouns (party names, person names, place names, statute names, Drucksachen numbers) verbatim.
  - Keep `§` references as-is in long-form fields; convert to "Section X" only when the surrounding sentence requires it.
  - No em dashes.
  - No invented content. If unsure of a term, transliterate.
  - Return strict JSON: `{ "translations": [{ "id": "...", "field": "...", "en": "..." }, ...] }`.
- Concurrency: 4 parallel Sonnet calls via the existing shared limiter (`etl/bundestag/polarity/limit.mjs`).
- Idempotency: pick rows where the `_en` column is null **or** `translations_decisions.prompt_version` is older than current.

### Backend

- Server functions and prerender data builders gain a `locale: 'de' | 'en'` parameter.
- Lean and full JSON endpoints (`/api/votes.json`, `/votes/<id>.json`, ...) get an `_en` sibling: `/api/votes.en.json`, `/votes/<id>.en.json`. Same shape, English text picked from the `_en` columns with German fallback if null.
- `vite.config.ts` writes both sets in the existing `writeJsonEndpoints()` pass.

### Designer deliverable

ASCII mock for the language switcher in the global header. Must be:

- Visible without hunting (top right, next to the dev banner).
- Clearly bidirectional (highlight current language, label the other).
- Mobile-OK (the header is already cramped on phones; the switch should be at most ~50px wide).

## Estimation

**Effort (engineering):** ~3 specialist days end-to-end, sequenced:

1. designer — switcher mock (a few minutes).
2. plumber — schema migration + `etl/translate/` runner with one target table wired (votes), then add the others (half a day).
3. backend — locale parameter through server fns + dual JSON endpoints (half a day).
4. frontend — `/en/` prefix, `useLocale`, `t(key)` hook, header switcher, hreflang in sitemap, UI string seed in `de.ts`/`en.ts` (one day).
5. Manual review pass on Priority 1 translations (a few hours of spot-checking; the prompt should hold up but vote titles especially are worth eyeballing).

**LLM budget via `claude -p sonnet`:**

| Surface | Items | Batch size | Calls |
|---|---|---|---|
| Vote text (5 fields) | 300 × 5 = 1,500 | 20 (titles) / 5 (long) | ~200 |
| Antrag text | 833 × 2 | 20 / 5 | ~250 |
| Anfrage titles | 8,418 | 20 | ~420 |
| UI strings | ~500 keys | 50 | ~10 |
| **Priority 1 total** | | | **~880 calls** |
| Speeches (Priority 2) | 25,463 | 1 | ~25,500 |
| Anfrage answers (Priority 2) | 8,418 | 1 | ~8,500 |

Priority 1 fits inside two or three Max-tier daily windows. Priority 2 is the big one — on Max 20x with the 4-parallel limiter, speeches alone run for roughly a week of background ETL. Worth waiting on until we want it.

**Should we do it?** Yes for Priority 1. It's the highest-leverage feature on the roadmap for international reach (journalists, expats, EU policy folks) and the cost on his subscription is effectively zero. Priority 2 is a "press the button and let it churn" job we can start after Priority 1 ships.

## Open questions

- Switcher: pill (`EN | DE`) vs flag vs full word (`English / Deutsch`)? Defer to designer.
- For Priority 2 deferred surfaces: show German with a banner, or 404 the English route? Lead's call.
- Do we want a third locale path one day (Turkish? Arabic?) — schema (`_en`) vs a long format (`translations(table, id, column, lang, text)`) decision. Lead leaning toward `_en` columns now, refactor when a second non-German language gets requested. Cheaper today, more painful later if it lands.
- Speech translation strategy if Priority 2 is deferred: hide the speech text on `/en/`, show only the German excerpt with a "translation pending" tag, or render German verbatim with the banner? Lead's call once we get there.

## Log

- 2026-05-14 lead: plan created at user's request — feature parked, not started.
- 2026-05-15 lead: completed English routing, UI copy, legal pages, vote text, party summary text and linked vote speech translations. German remains default, English lives under `/en`. PDFs, Anfragen and the full unlinked speech archive remain out of scope.
