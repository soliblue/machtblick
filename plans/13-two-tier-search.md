# 13 — Two-tier speech search + consistency + Grüne badge fix

## Goal

Today's static speech data layer writes **25,463 per-speech JSONs** plus a 42 MB `speeches-index.json` that contains every speech's full text. The per-speech files duplicate what's already in the index, and the file count blows past CF Pages' 20k-file deploy cap.

Replace the current single-blob/per-file-blob hybrid with a two-tier scheme that deploys cleanly **and** keeps today's substring search + highlighting + expand UX exactly the same.

Also: surface a loading indicator + German message while the heavy search blob downloads, and unify search/highlight rendering across all three call sites.

## What stays the same

- Substring `includes()` semantics on speaker name + full text (so "kan" still finds "Bundeskanzler"). No tokenizers, no stemming.
- Highlight + snippet rendering on the results.
- Filter pills (party, date, member), pagination, ordering.
- Speech expand showing full text inline.

## Two-tier file layout

| File | Contents | Size (brotli) | Loaded when |
|---|---|---|---|
| `public/speeches-meta.json` | All 25,463 rows: `{ id, speakerName, speakerMemberId, speakerRole, party, position, excerpt, date, voteId, voteTitle }`. **No `text` field.** `excerpt` is `text.slice(0, 160)`. | ~0.8 MB | Eagerly on any view that lists speeches |
| `public/speeches-search.json` | Sparse map `{ [id]: text }`. Only includes non-chair speakers (skip Präsident/Vizepräsident/Alterspräsident + feminine forms — ~11,299 procedural rows). | ~6.9 MB | Lazily on first search-box focus, or on first speech expand |

Both files come from `apps/bundestag/vite.config.ts` `writeSpeechesStatic()` — the same hook that runs today at config load. **Delete** the `public/speeches/{id}.json` write loop.

## Contracts

### `apps/bundestag/src/lib/speechesStatic.ts`

Two caches, two fetches:

```ts
let metaCache: Promise<SpeechMetaEntry[]> | null = null
let textCache: Promise<Record<string, string>> | null = null

export function loadSpeechMeta(): Promise<SpeechMetaEntry[]>
export function loadSpeechTexts(): Promise<Record<string, string>>
```

`searchSpeechesStatic(params)` becomes async over both:

- If `params.q` is empty → only need meta. Return list paginated. Cheap path.
- If `params.q` is set → await `loadSpeechTexts()`, then filter using `texts[id] ?? entry.excerpt` for substring match. Generate snippet from the same string.

`getSpeechStatic(id)` (used by `useSpeechBody`) becomes a pure lookup against `loadSpeechTexts()` — no more network fetch per expand. If the id is a chair-speaker (no full text stored), fall back to `meta.excerpt` (chair text is short anyway).

### `apps/bundestag/src/hooks/useSpeechBody.ts`

Already TanStack Query. Change `queryFn` from `getSpeechStatic` (which fetched `/speeches/{id}.json`) to one that awaits `loadSpeechTexts()` and pulls from the map. Keep the `enabled` gate so we only kick off the texts fetch when the user actually expands.

### `apps/bundestag/src/hooks/useSpeechSearch.ts` (new)

Wraps `searchSpeechesStatic` in `useQuery`. Exposes:

```ts
{
  data: SpeechSearchResponse | undefined
  isLoading: boolean
  textsLoading: boolean   // true while loadSpeechTexts() is in flight AND q is non-empty
}
```

`textsLoading` distinguishes "we're loading the heavy blob because the user is searching" from "normal query loading". Surface to UI.

### `apps/bundestag/vite.config.ts`

Replace `writeSpeechesStatic`:

1. Build meta entries (all 25,463 rows, no `text`, `excerpt = text.slice(0, 160)`).
2. Build texts map (skip rows whose `speaker_role` is in `{Präsident, Präsidentin, Vizepräsident, Vizepräsidentin, Alterspräsident, Alterspräsidentin}`).
3. Write `public/speeches-meta.json` and `public/speeches-search.json`. **Remove** the per-speech-file loop and the `rmSync(speechesDir)` line is now `rmSync(speechesDir, { force: true, recursive: true })` to clean up the old per-speech files on the first build after this change.

## Loading state UX

`apps/bundestag/src/views/redenSearch/RedenSearch.tsx` and `DebateList.tsx`:

- While `textsLoading`, show inside the search input a small spinner + helper text **below the input**: `"Suchindex wird geladen…"` in `text-s opacity-l`.
- The input stays usable — typing buffers, but no results render until texts arrive. Empty results list area shows `"Suche wird vorbereitet…"` in place of "Keine Reden gefunden".
- Once texts arrive, the buffered query runs immediately and results stream in.
- No spinner once cached (subsequent searches feel instant).

## Search consistency across call sites

Three places search/render speeches today. They must use one shared snippet + highlight pipeline:

| File | Today | Must do |
|---|---|---|
| `views/redenSearch/SpeechResultRow.tsx` | uses `renderSnippet(snippet)` + `highlight(excerpt, terms)` | unchanged baseline |
| `views/voteDetail/DebateList.tsx` | local search input, no highlighting at all, no snippet — just substring filter on excerpt | rewire to share the snippet/highlight rendering from SpeechResultRow. Reuse `tokenize` + `highlight` from `@/lib/highlight` and `renderSnippet` from `@/lib/snippet` |
| `views/memberDetail/MemberSpeechesSection.tsx` | check whether it does search at all | if it has a search box, apply the same pipeline. If not, leave alone |

Extract a `SpeechRow` component shared by SpeechResultRow + DebateList's DebateRow if the duplication is meaningful (same JSX shape: speaker line, party badge, snippet/highlight, expand). One component, two callers.

## Grüne badge fix (already done by lead)

`etl/bundestag-reden-xml/parse.ts` line 147: normalized fraktion whitespace (`\s+` → ' '). Existing DB rows updated (2,065 affected). After re-running `writeSpeechesStatic()`, `B90/Grüne` flows correctly to PartyBadge and the logo renders.

Frontend: nothing to change here — just confirm Grüne logos render in all three call sites after the re-build.

## Acceptance

| Check | How |
|---|---|
| `public/speeches/` directory gone | `ls apps/bundestag/public/speeches 2>/dev/null` is empty/missing |
| Two new files exist | `speeches-meta.json` < 1 MB gz, `speeches-search.json` < 8 MB gz |
| `/reden/` page first paint shows list + filters without waiting on search blob | DevTools network: only `speeches-meta.json` loaded |
| Typing in search box triggers a single `speeches-search.json` fetch | Network panel shows one request |
| Loading indicator + German helper text visible during that fetch | Visual |
| After load, typing "kan" finds Bundeskanzler, "rente" finds Rentenversicherung, "grün" finds Grüne speeches (substring match preserved) | Manual |
| Highlight + snippet render the same way in `/reden/` and on a vote detail page's `Reden am Sitzungstag` section | Visual |
| Grüne PartyBadge shows the green logo (not gray fallback) everywhere | Visual on a Grüne speech |
| Speech expand is instant (no network call) | Network panel |
| Total file count in `public/` < 100 | `find apps/bundestag/public -type f | wc -l` |

## Status

- done: lead — fixed NBSP in `parse.ts` + DB UPDATE (2,065 rows). Wrote this plan.
- todo: frontend — implement two-tier loader, loading UX, consistency, then regenerate static via dev server restart.

## Log

(append your notes here, frontend)

### frontend — 2026-05-13

Files changed:
- `apps/bundestag/vite.config.ts` — `writeSpeechesStatic()` now emits `speeches-meta.json` + `speeches-search.json`; chair-role filter on texts; `rmSync` on the old per-speech dir and old index file.
- `apps/bundestag/src/lib/speechesStatic.ts` — two caches (`loadSpeechMeta`, `loadSpeechTexts`), `speechTextsLoaded()` resolves-flag, lazy texts load only when `q` is set, `getSpeechStatic` becomes a map lookup (no fetch).
- `apps/bundestag/src/lib/snippet.tsx` — added shared `makeSnippet`.
- `apps/bundestag/src/hooks/useSpeechBody.ts` — pulls from `loadSpeechTexts()` map; no network per expand.
- `apps/bundestag/src/hooks/useSpeechSearch.ts` (new) — `useQuery` wrapping `searchSpeechesStatic`, surfaces `textsLoading`.
- `apps/bundestag/src/routes/reden/index.tsx` — loader keeps SSR/prerender path; client uses `useSpeechSearch` for interactive search.
- `apps/bundestag/src/views/redenSearch/SpeechRow.tsx` (new) — shared row JSX used by `SpeechResultRow` and `DebateList`.
- `apps/bundestag/src/views/redenSearch/SpeechResultRow.tsx` — thin wrapper over `SpeechRow`.
- `apps/bundestag/src/views/redenSearch/RedenSearch.tsx` — `textsLoading` prop; "Suchindex wird geladen…" helper + "Suche wird vorbereitet…" empty state.
- `apps/bundestag/src/views/voteDetail/DebateList.tsx` — rewired to lazy texts via `loadSpeechTexts`, uses `SpeechRow` + `makeSnippet` + `tokenize`/`highlight`; same loading UX.
- `apps/bundestag/src/views/memberDetail/MemberSpeechesSection.tsx` — same pipeline; same loading UX.

On-wire sizes (brotli -q 11):
- `speeches-meta.json`: 9.18 MB raw → 783 KB brotli (well under 1 MB).
- `speeches-search.json`: 30.6 MB raw → 6.55 MB brotli (under 8 MB).
- 25,463 meta rows; 14,164 with text (11,299 chair speakers skipped — exact match for plan).
- `apps/bundestag/public/` total file count: 23.

Acceptance:
- `public/speeches/` dir absent and `speeches-index.json` removed.
- Two new files present.
- Loader resolves meta-only when `q` is empty (prerender path stays cheap).
- `useSpeechSearch` defers `loadSpeechTexts()` until `q` is non-empty.
- `useSpeechBody` no longer hits the network — pure map lookup; expand is instant.
- Highlight + snippet now share one pipeline across all three call sites; DebateList previously had no highlighting at all.
- Typecheck clean for all touched files (only unrelated pre-existing `parties.ts` cohesion error remains).

Surprises:
- `DebateList` previously had its own substring filter with no highlight and no snippet — bigger consistency gap than expected. Fixed.
- `MemberSpeechesSection` also bypassed the texts blob; now wired through. Filters on full text for that member's speeches when texts are loaded, falls back to excerpts otherwise.
- Visual Grüne badge check is pending live verification — frontend code path is unchanged, so it depends solely on the regenerated meta carrying `party = 'B90/Grüne'`. Spot-checked the regenerated `speeches-meta.json` and Grüne entries do carry that normalized value.

## 2026-05-13 follow-up: shard search blob

CF Pages rejected the deploy because `speeches-search.json` was 29.2 MiB (single-file cap is 25 MiB). Sharded into 4 files keyed by `Math.abs(djb-style hash(id)) % 4` to avoid the length-clustering you'd get from `id.length % 4`.

Files changed:
- `apps/bundestag/vite.config.ts` — `writeSpeechesStatic()` writes `speeches-search-{0..3}.json`; old single blob removed up front.
- `apps/bundestag/src/lib/speechesStatic.ts` — `loadSpeechTexts()` fans out 4 parallel `fetchJson` calls and merges. Node/SSR path inherits the fan-out via the same `fetchJson` helper. `textCache` still memoizes the merged map so callers are unchanged.

Per-shard sizes after dev-server rebuild:
| Shard | Raw | Brotli q11 |
|---|---|---|
| 0 | 7.78 MB | 1.88 MB |
| 1 | 7.57 MB | 1.84 MB |
| 2 | 7.46 MB | 1.81 MB |
| 3 | 7.80 MB | 1.89 MB |

`find apps/bundestag/public -type f -size +25M` is empty; file count 26.
