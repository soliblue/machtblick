# 05 — Bundestag speeches (Reden)

## Goal

Ingest every plenary speech from the 21. Bundestag (2025-03-25+) and surface it in three places:

1. **Embedded under each vote** (`/votes/$id`): a Debatte section listing the speeches from that vote's TOP in chronological order, click-to-expand the full text.
2. **Top-level searchable Reden section** (`/reden`): full-text search across all speeches with party / speaker / date filters. Each result links to the vote(s) the debate produced.
3. **On the member detail page** (`/members/$id`): the MP's own speeches, sorted by date.

## Status

Stage 1 starting (vote-embedded Debatte). Stages 2 (/reden search) and 3 (member tab) wait until stage 1 lands and we trust the data shape.

## Speakers without an MP record

Government representatives (Bundeskanzler, Minister), Bundesrat members, and external speakers don't link to an MP profile. We render their name plus a role label (e.g. "Bundeskanzler", "Bundesratsmitglied") and skip the link — but they still appear in Debatte lists and search results.

## Data source

**Primary candidate: Open Discourse** (https://opendiscourse.de) — research dataset, every Bundestag plenary speech parsed into structured rows. Quarterly release; license is open. Plumber should verify 21. BT coverage before ingest; if behind, fall back to parsing plenary protocols (XML) directly from `bundestag.de/dokumente/protokollarchiv`.

**Critical join field:** every speech must carry `session_id` (e.g. `21-74`) and `agenda_item` (e.g. `21-74-10`). Our existing `votes.bundestag_id` already encodes the same identifier (`pp21-74-10-erhalt-...`), so the link is a string prefix match.

## Shared contracts

### Schema (`db/schema/speeches.ts`)

```ts
speeches {
  id: text pk                     // upstream id or hash
  session_id: text                // "21-74"
  agenda_item: text               // "21-74-10"
  vote_id: text | null            // FK to votes.id (nullable: not every debate ends in a vote)
  speaker_member_id: text | null  // FK to members.id (nullable: gov representatives, Bundesratsmitglieder)
  speaker_name: text              // raw name from upstream as fallback
  speaker_role: text | null       // "Bundeskanzler", "Präsident", null
  party: text | null              // canonical fraction name
  date: text                      // ISO yyyy-mm-dd
  position: integer               // ordinal within session for chronological sort
  text_excerpt: text              // first ~280 chars, indexed for search
  text_full: text                 // full speech body
  word_count: integer
}
```

Plus an FTS5 virtual table for full-text search.

### Backend additions

- `apps/bundestag/src/server/speeches.ts`
  - `listSpeechesForVote(voteId)` → ordered list for the Debatte section
  - `searchSpeeches({ q, party, speakerId, dateFrom, dateTo })` → paginated results for /reden
  - `listSpeechesForMember(memberId)` → for member detail

- `getVote(id)` extended to include `debate: SpeechSummary[]` (id, speakerName, party, excerpt) — keeps prerender simple, no extra round trip
- `getMember(id)` extended to include `speeches: SpeechSummary[]`

### Views

- `apps/bundestag/src/views/voteDetail/DebateList.tsx` — chronological speech list, click to expand body inline (no modal). Uses the section-caption style.
- `apps/bundestag/src/views/redenSearch/` — new view family. `SearchInput`, `SpeechResult`, filters. Lives under `/reden`.
- Member detail gets a new tab/section (mirror VotingRecordTab structure) for the MP's own speeches.

## Open questions

- Does Open Discourse have 21. BT data already? Plumber to confirm before scoping ETL effort. If not, write a `bundestag-protokoll` ETL that parses the XML protocols directly.
- Search ranking: BM25 default from SQLite FTS5 is fine for v1. Defer learned ranking.
- Prerender vs edge for `/reden`: only the landing/empty state needs prerender. Search results stay CSR + serverFn.

## Log

- 2026-05-12 lead: plan created. Scope: 21. BT only, three surfaces (vote-embedded, /reden search, member detail).
- 2026-05-12 plumber: Stage 1 schema + ETL landed. Source switched from Open Discourse to CPP-BT (Fobbe, Zenodo) — single parquet, CC0, every speech parsed. Cutoff `2026-01-17` covers Sitzungen 1–53 of 21. BT (6167 speeches). Migration `0005_clammy_carlie_cooper.sql` creates `speeches` + FTS5 mirror `speeches_fts` with 3 sync triggers; applied to `db/machtblick.sqlite`. `npm run etl:speeches` is idempotent.
  - **Contract change:** CPP-BT does **not** carry a TOP/agenda-item index, so `agenda_item` is always null and per-vote attribution at ingest is not possible from this source. Plan's `pp21-{session}-{top}-*` join key has to be replaced by a session+date heuristic at read time. ETL links `vote_id` only when the session has exactly one `pp21-{sess}-*` vote (rare) or the date has exactly one vote: 1631/6167 speeches → 12/300 votes covered. Every speech does carry `session_id` (`"21-{sitzung_nr}"`) and `date`, which backend's `listSpeechesForVote` should join through.
  - Speaker linkage: 5215 matched to a member (after normalizing honorifics: `dr prof ing habil med hc dent rer nat phil jur mult mag lic theol dipl pol`), 950 government/Bundesrat roles handled via `speaker_role`, 2 genuinely unmatched. `speaker_member_id` is intentionally left null whenever a `redner_rolle_*` is set, even if the same person sits in parliament — they speak in government capacity.
  - Per-fraktion breakdown of ingested speeches: CDU/CSU 1389, AfD 1288, SPD 968, Grüne 891, Linke 643, fraktionslos 38, + 950 government roles (Bundesminister 482, Bundesministerin 362, Bundeskanzler 40, Parl. Staatssekretär 32, Staatsminister 30, plus 4 single-speaker roles).
  - Quirks logged in `.claude/agents/plumber.md` under "Bundestag speeches (CPP-BT)": (1) Svenja Schulze's name comes through as `SvenjaSvenja`/`SchulzeSchulze` in 10 rows — upstream XML extraction bug, ETL applies `dedupeRepeat`. (2) `redner_fraktion` is null for sitting MPs when they speak as ministers, distinct from `fraktionslos`. (3) No TOP field — the biggest contract gap, surfaced above.
  - Backend (next): build `apps/bundestag/src/server/speeches.ts` with `listSpeechesForVote(voteId)` doing the session+date join, `searchSpeeches({ q, ... })` via FTS5 MATCH, and `listSpeechesForMember(memberId)` straight off `speaker_member_id`. Extend `getVote` / `getMember` with `debate` / `speeches` summary arrays.
- 2026-05-12 backend: Stage 1 surface landed. `apps/bundestag/src/server/speeches.ts` exports `SpeechSummary`, `SpeechFull`, `listSpeechesForVote(voteId)`, `getSpeech(speechId)`. `getVote` now returns `debate: SpeechSummary[]` (prerender-friendly, no extra round trip). Search and member tab deferred to Stage 2/3.
  - **Join key:** votes have no `session_id` and `bundestag_id` is just an integer (e.g. `1003`), not `pp21-{session}-{top}-*` as the original plan assumed. Speeches do carry `session_id` and `date`; `date` is 1:1 with `session_id` in the data (verified, no date maps to >1 session). Join is `speeches.date = votes.date`, ordered by `speeches.position`. Returns every speech of the sitting day, which is the right Stage 1 surface anyway since CPP-BT has no TOP.
  - **Party normalization:** added a local `PARTY_NORMALIZE` map in `speeches.ts` mapping `BÜNDNIS 90/DIE GRÜNEN` → `B90/Grüne` and `DIE LINKE` → `Die Linke` so PartyBadge etc. work unchanged. Other fraktion strings (`CDU/CSU`, `SPD`, `AfD`, `fraktionslos`) already match canonical names. Not lifted to `lib/parties.ts` yet — single call site.
  - Speaker fields are read directly from the stored `speaker_name` / `speaker_role` / `speaker_member_id` (plumber already composed honorifics+vorname+nachname at ingest), no recomposition needed.
  - `getSpeech` (not `getSpeechById` — followed the code spec, prose used the longer name) returns `SpeechFull` with full body + ISO date for inline expansion.
- 2026-05-12 frontend: Stage 1 vote-detail surface wired. New `apps/bundestag/src/views/voteDetail/DebateList.tsx` renders the "Reden am Sitzungstag" caption (`text-s uppercase opacity-l`, `letterSpacing: 0.08em`) plus one row per speech: speaker name (semibold; `/members/$id` link only when `speakerMemberId` is set), `PartyBadge` when `speakerRole` is null, else a neutral `text-s opacity-l` role label, 2-line clamped excerpt, and a right-aligned `ChevronDown` that rotates 180deg on open. Rows use the existing `border-t` + `color-mix(in oklab, var(--color-fg) 15%, transparent)` separator, no rounded corners. Click anywhere on a row toggles inline expansion of the full body. Logic lives in `apps/bundestag/src/hooks/useSpeechBody.ts` — a `useQuery` wrapper over `getSpeech` keyed by speech id, `enabled` only when expanded, `staleTime: Infinity`. Loading shows a thin opacity-8% bar. Wired into `VoteDetail.tsx` between `<PartyWaffle />` and the Abweichler section, gated on `data.debate.length > 0`.
  - **Dep added:** `@tanstack/react-query` (^5.62.7) in `apps/bundestag/package.json`, plus a single `QueryClient` + `QueryClientProvider` wrapping the app in `__root.tsx`. Run `npm i` in `apps/bundestag` before `npm run dev`.
  - No TS errors against the backend contract; backend already landed `debate` on `getVote` and the `getSpeech` server fn, so the view compiles end-to-end.
  - Out of scope (Stage 2/3): `/reden` search and member-tab speech list. Not built.
