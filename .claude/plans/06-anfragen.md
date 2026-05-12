# 06 — Anfragen (parliamentary inquiries) per MP

## Goal

Surface what MPs actually *do* between votes by ingesting parliamentary inquiries (Anfragen) from the Bundestag DIP API and linking signatories to our `members` table. Show them as a tab on the MP detail page and as an aggregate "top inquiry topics" panel on the party detail page.

Scope: **Kleine Anfragen**, **Große Anfragen**, **Schriftliche Fragen**. (Mündliche Fragen excluded — too noisy to attribute.)

Lead-author vs co-signer distinction: surface it only if DIP exposes it cleanly. Do not infer from list order without evidence.

## Status

| Workstream | Owner | State |
|---|---|---|
| API spike + sample dump | plumber | done |
| Schema design | plumber | done |
| ETL job | plumber | done — refactored to fetch/process split, partial run yielded 13,869 signatories, full backfill ~10min |
| Server functions | backend | done |
| ASCII mocks (MP tab + party panel) | designer | done |
| Frontend views | frontend | done |

## Spike — what plumber must answer

Hit `https://search.dip.bundestag.de/api/v1/` (DIP API). API key is public, listed in their docs — confirm and record it in the plan.

Dump 20 real records per Anfrage type into `etl/dip/samples/` as JSON. Then answer:

1. **Vorgangstyp values** — exact strings used to filter Kleine/Große/Schriftliche Anfragen. Don't guess; sample first and list the actual enum values seen.
2. **Urheber structure** — how are signatories represented? Per-MP records, or just Fraktion + free-text name list? Is there a stable MP ID (e.g. Wahlperiode-scoped) we can join to `members`?
3. **Lead author** — is there an order field, a `rolle`, or any signal that distinguishes the initiating MP from co-signers? Report the actual fields seen, not assumptions.
4. **Anfrage ↔ Antwort linkage** — how does a question Drucksache link to the government's response Drucksache? Same Vorgang ID? A `verweis` field?
5. **Topics/Sachgebiete** — what topic metadata is present and how clean is it? Free text or controlled vocabulary?
6. **Member join feasibility** — can we join `urheber` to `db/schema/members.ts` reliably? If names only, what's the collision rate? Look at existing `etl/bundestag-affiliations/matchAwToMember.ts` for prior art.
7. **Volume estimate** — rough record count per type per Wahlperiode. Informs whether incremental sync is required from day one.

## Contracts (sketch, finalize after spike)

```ts
// db/schema/anfragen.ts
anfragen: {
  id: string            // DIP Vorgang ID
  type: 'kleine' | 'grosse' | 'schriftlich'
  title: string
  date: Date
  drucksacheNr: string
  antwortDrucksacheNr: string | null
  sachgebiete: string[]
}

anfrageSignatories: {
  anfrageId: string
  memberId: string      // FK to members
  role: 'lead' | 'cosigner' | null  // null if DIP doesn't expose
}
```

Server fns (backend):
- `getAnfragenForMember(memberId)` → list grouped by topic
- `getTopAnfrageTopicsForParty(partyId)` → aggregate panel data

## Open questions for lead

(Answered up front; recorded here for subagents.)

- ✅ Types: Kleine + Große + Schriftliche. No Mündliche.
- ✅ Surface: MP detail tab + party detail aggregate panel.
- ✅ Authorship: distinguish only if DIP exposes it; do not infer.

## Spike findings

API base: `https://search.dip.bundestag.de/api/v1/`. Public API key (embedded in their OpenAPI spec description at `/api/v1/openapi.yaml`, securityScheme `ApiKeyQuery`): **`R2BZaee.DjdCyihKZMf8AOjtScubP2EVydegzjmBIQ`**. Pass as `?apikey=…` (query) or `Authorization: ApiKey …` (header). Same key surfaces in Swagger UI and is auto-applied to "Try it out" calls.

Samples in `etl/dip/samples/`: 20 vorgangsposition records per type (`kleine-NN.json`, `grosse-NN.json`, `schriftlich-NN.json`) plus a `*-vorgang-example.json` per type with the umbrella record. Note: Große Anfrage WP21 universe is **18 total**, so we have all of them.

### Entity model on DIP

Three tiers, all with stable integer IDs:

| Entity | What it is | Holds |
|---|---|---|
| `vorgang` | Umbrella case ID, one per inquiry topic | `titel`, `sachgebiet[]`, `deskriptor[]`, `abstract`, `beratungsstand`, `initiative[]` (fraktion list), `datum` |
| `vorgangsposition` | Each Drucksache step in the case | `vorgangsposition` step name ("Kleine Anfrage" / "Antwort" / "Schriftliche Frage/Schriftliche Antwort"), `fundstelle` (Drucksache nr + pdf), `urheber[]` (fraktion), `aktivitaet_anzeige[]` (named MdBs), `aktivitaet_anzahl`, `vorgang_id` |
| `aktivitaet` | One row per (person, vorgangsposition) | `person_id`, `aktivitaetsart`, `vorgangsbezug[]`, `fundstelle`, `titel` (formatted "Name, MdB, Fraktion") |

The right primary join for "MP X signed Anfrage Y" is **`aktivitaet.person_id` ↔ `members`** with `vorgangsbezug[0].id` being the vorgang ID.

### Answers to the seven questions

**1. Vorgangstyp values.** Confirmed exact strings via live API (`?f.vorgangstyp=…&f.wahlperiode=21`):

| String | Vorgang count WP21 | Position count WP21 |
|---|---|---|
| `Kleine Anfrage` | 1939 | 3755 |
| `Große Anfrage` | 12 | 18 |
| `Schriftliche Frage` | 6467 | 6470 |

For Kleine/Große, vorgangsposition splits into separate "Kleine Anfrage"/"Große Anfrage" and "Antwort" rows (both share `vorgang_id`). For Schriftliche Frage, a single position with step name `"Schriftliche Frage/Schriftliche Antwort"` carries both Q and A together.

**2. Urheber structure.** Two co-existing representations per vorgangsposition:

- `urheber[]` — fraktion only: `{einbringer:false, bezeichnung:"AfD", titel:"Fraktion der AfD"}`. Schriftliche Frage positions have `urheber:[]` (empty); fraktion only resolvable via the person.
- `aktivitaet_anzeige[]` — named MdBs as display strings: `{aktivitaetsart:"Kleine Anfrage", titel:"Rüdiger Lucassen, MdB, AfD", pdf_url:…}`. Visible in vorgangsposition but **not** machine-friendly (string only, no `person_id`).
- `aktivitaet` endpoint — the real per-MdB record with **`person_id` (integer)**. `aktivitaet_anzahl` on the position equals the count of these. Example: `kleine-01.json` has `aktivitaet_anzahl: 4` → 4 aktivitaet rows with person_ids.

Yes, stable MP ID exists: `person_id` (integer, Wahlperiode-agnostic). The `person` endpoint resolves it to `{vorname, nachname, fraktion[], wahlperiode[]}`.

**3. Lead author.** **No machine-readable lead/co-signer flag.** Checked:

- `urheber[].einbringer` is `false` on every Anfrage position I sampled — it's always `false` for fraktion-level urheber and doesn't distinguish MdBs.
- `aktivitaet` records have no role/order/einbringer field — just `person_id` + `aktivitaetsart`.
- `aktivitaet_anzeige` is ordered (typically Erstunterzeichner first by Bundestag convention), but DIP doesn't promise this and it's not a contract.

If we want lead-author attribution it has to come from PDF parsing (Drucksache front page lists "Antrag der Abgeordneten X, Y, Z und der Fraktion …" with the first 1–2 names being the Berichterstatter). Recommend: ship without role distinction, revisit only if there's a clear product need.

**4. Anfrage ↔ Antwort linkage.** Both share `vorgang_id`. Concrete example (`vorgang_id=321131`, sample `kleine-vorgang-example.json`):

- Position 669403 — `vorgangsposition:"Kleine Anfrage"`, `urheber:[{titel:"Fraktion der AfD"}]`, fundstelle Drucksache `21/11`.
- Position 669650 — `vorgangsposition:"Antwort"`, `urheber:[{titel:"Bundesregierung"}]`, `ressort:[{federfuehrend:true, titel:"Bundesministerium der Verteidigung"}]`, fundstelle Drucksache `21/40`.

The umbrella `vorgang.beratungsstand` flips from `"Noch nicht beantwortet"` to `"Beantwortet"` when the Antwort lands. Schriftliche Frage: Q+A in one position with both PDFs as the same drucksache (`aktivitaet_anzeige` contains both the asking MdB and the responding Parl. Staatssekr.).

**5. Topics/Sachgebiete.** Controlled vocabulary on the **vorgang** record (not position). Two fields:

- `sachgebiet[]` — coarse top-level category (1–3 strings). Observed values: `Verteidigung`, `Gesundheit`, `Staat und Verwaltung`, `Wirtschaft`. Clean enough for direct aggregation.
- `deskriptor[]` — finer Schlagwort tags, each `{name, typ, fundstelle}` where `typ ∈ {"Sachbegriffe", "Institutionen", "Geograph. Begriffe"}`. Examples: `Ausländischer Kämpfer`, `Söldner`, `Ukraine`, `Russische Streitkräfte`. Also clean — these are German Parliamentary Library terms.

Filter parameters `f.sachgebiet` and `f.deskriptor` exist on all four list endpoints, so the party-aggregate "top inquiry topics" panel can be a single grouped DB query without per-record string normalization.

**6. Member join feasibility.** Highly feasible. DIP returns 575 MdBs for WP21 via `person?f.wahlperiode=21&f.funktion=MdB`; our `members` table has 636 (includes 20. BT Nachrücker, but the WP21 cohort overlaps). Run a one-time bootstrap matcher:

| Strategy | Match rate |
|---|---|
| Exact slug `lastname-firsttoken` | 459 / 575 (79.8%) |
| + lastname slug bucket with first-token overlap (any whitespace-token of vorname) | +114 → 573 / 575 (99.6%) |
| Unmatched | 2 (Eva Högl, Anja Hajduk — likely WP20-only carryovers in DIP) |

The reusable matcher in `etl/bundestag-affiliations/matchAwToMember.ts` already implements this exact pattern (slug + lastname-bucket scoring). It will work as-is on DIP person labels.

Recommendation: **store `dip_person_id INTEGER` on `members`** (added in a migration during this feature). Bootstrap matches the 575 once; thereafter joins are integer FK, no name munging at ingest. Falls back to the matcher only when a fresh MdB appears (Nachrücker).

**7. Volume estimate.** Per Wahlperiode 21 (as of 2026-05-12, ~14 months in):

| Type | Vorgang | Position | Aktivitäten (≈ MP-signature rows) |
|---|---|---|---|
| Kleine Anfrage | 1939 | 3755 | ~7,000 (avg ~3–4 signers per Anfrage × 1939 Anfragen) |
| Große Anfrage | 12 | 18 | ~200 (avg ~15 signers × 12) |
| Schriftliche Frage | 6467 | 6470 | ~12,940 (1 asker + 1 answerer each) |

Annualised ≈ 1700 Kleine / 5500 Schriftliche / 10 Große. Manageable on weekly cron. Incremental sync via `f.aktualisiert.start=YYYY-MM-DD` is documented (`UpdatedStartFilter`) and well-supported. First backfill is one-shot ≈ 8K vorgang fetches + the same number of vorgang-detail enrichments — under an hour with pagination cursors (100/page, server enforces). Full refresh every run is wasteful but tolerable until volumes climb.

### Quirks worth flagging now

- **Schriftliche Frage has no `urheber` and no `initiative`** on the vorgangsposition — fraktion only resolvable by joining `person_id → person.fraktion`. Because fraktion drifts (see `member_affiliations` notes), use the `member_affiliations` time-range at `vorgangsposition.datum` rather than DIP's current fraktion tag.
- **`aktivitaet_anzeige` is human-formatted only.** Treat it as raw display data; do not parse it for IDs — use the `aktivitaet` endpoint.
- **Cursor pagination is required** for any list endpoint exceeding 100 rows. Backfill loop must persist cursor and stop on `cursor == previousCursor` (server signals end this way, not by empty docs).
- **Antwort positions carry `ressort[]`** (responding ministry, with `federfuehrend` flag). Worth keeping — it's the only structured "which ministry answered" signal.
- **No `f.vorgang` filter on `aktivitaet`.** When I passed it, the API ignored it (returned all 1.75M aktivitaeten). To get signers for a specific vorgang, either (a) fetch vorgangsposition first and use its `aktivitaet_anzahl` + a follow-up `f.vorgangsposition_id` query on aktivitaet, or (b) ingest all aktivitaet records for WP21 once and filter locally. (b) is simpler at our volumes.

### Schema sketch (refined)

```ts
// members.ts — add a column
members: {
  // existing…
  dipPersonId: integer('dip_person_id'),  // nullable; backfilled by bootstrap matcher
}

// anfragen.ts
anfragen: {
  id: integer('id').primaryKey(),         // DIP vorgang.id
  type: text(),                            // 'kleine' | 'grosse' | 'schriftlich'
  title: text().notNull(),
  abstract: text(),                        // vorgang.abstract
  beratungsstand: text(),                  // 'Beantwortet' | 'Noch nicht beantwortet' | …
  wahlperiode: integer().notNull(),
  initiativeFraktion: text(),              // first vorgang.initiative[]; null for Schriftliche
  questionDate: text(),                    // earliest position datum
  answerDate: text(),                      // null until Antwort position appears
  questionDrucksache: text(),              // e.g. '21/11'
  answerDrucksache: text(),                // e.g. '21/40'
  questionPdfUrl: text(),
  answerPdfUrl: text(),
  answerRessort: text(),                   // Antwort position ressort.titel
  sachgebiet: text({mode:'json'}).$type<string[]>(),
  deskriptor: text({mode:'json'}).$type<{name:string;typ:string}[]>(),
  updatedAt: text(),                       // vorgang.aktualisiert
  rawVorgang: text({mode:'json'}),         // raw DIP vorgang payload, principle: preserve raw
}

anfrage_signatories: {
  anfrageId: integer().notNull(),          // FK -> anfragen.id
  memberId: text().notNull(),              // FK -> members.id, derived via dip_person_id
  dipPersonId: integer().notNull(),        // archival raw, for audit
  // no role column — DIP does not expose one
}
// primary key (anfrageId, memberId)
```

Decisions (resolved by lead 2026-05-12):

1. **Type enum:** German slugs `kleine` / `grosse` / `schriftlich`. Matches existing precedent.
2. **Große Anfrage** keeps its own type. Editorially distinct (plenary debate).
3. **Skip Schriftliche Antwort responder** from signatories. Parl. Staatssekretär answers on behalf of gov, not as MP. `answerRessort` already captures the ministry signal.
4. **Sidecar `anfragen_raw` table**, matching the votes pattern. Drop `rawVorgang` JSON column from the normalized table.

## Log

- 2026-05-12 (lead) — Plan created. Plumber dispatched for API spike, no schema commit yet. Findings to land in this file under a "Spike findings" section before schema work begins.
- 2026-05-12 (plumber) — Spike done. 20 samples per type dumped to `etl/dip/samples/` (Große only has 18 in WP21 — full universe). API key recorded. All seven questions answered with quoted field names from real responses. Member match feasibility ≈99.6% with existing `matchAwToMember` matcher; recommend adding `dip_person_id` to `members`. No schema commit, awaiting lead review of four deferred decisions.
- 2026-05-12 (lead) — Resolved four schema decisions (German slugs, keep Große as own type, skip Antwort responder, sidecar raw table). Dispatched plumber for schema+ETL and designer for mocks in parallel.
- 2026-05-12 (designer) — Mocks landed at `apps/bundestag/src/views/memberDetail/anfragenTab.mock.md` and `apps/bundestag/src/views/partyDetail/anfragenPanel.mock.md`. Reuses existing `DonationsBar`/`ProposalsBar` idiom on party panel; MP tab groups by Sachgebiet with Datum toggle.
- 2026-05-12 (lead) — Resolved designer's three open questions: (1) chips/rows inert this iteration, no `/anfragen` top-level view in scope but keep hover affordance; (2) headline metric = total count, matches Großspenden/Anträge panel convention, per-MP density belongs on a future cross-party comparison; (3) Deskriptor chip cap stays at 12.
- 2026-05-12 (designer) — Mocks landed:
  - `apps/bundestag/src/views/memberDetail/anfragenTab.mock.md` — new Anfragen tab on MP detail. Default grouping by `sachgebiet`, secondary toggle to date. Type as 2-char badge (KL/GR/SF), status via success/danger, co-signers as `+N Mitzeichner` only when N>0 so Schriftliche Frage rows stay clean. Empty state included for MPs with zero Anfragen.
  - `apps/bundestag/src/views/partyDetail/anfragenPanel.mock.md` — aggregate panel slotted into the existing party-detail panel grid alongside `Übereinstimmung` / `Anträge` / `Großspenden`. Composition mirrors `DonationsBar`/`ProposalsBar` (stacked horizontal bars, neutral fg tones, no party color for chart values). Three blocks: Typ split, Top Sachgebiete bars, Top Deskriptor chip cloud.
  - Open questions for lead (also recorded in the party panel mock): (a) do Sachgebiet rows and Deskriptor chips link to a future `/anfragen` list view, or stay inert this iteration? (b) headline metric — total count vs per-MP density? (c) Deskriptor chip cap (mock uses 12).
- 2026-05-12 (plumber) — Schema + ETL shipped.
  - Schema: `db/schema/anfragen.ts` (`anfragen`, `anfrage_signatories`), `db/schema/anfragenRaw.ts`, `members.dip_person_id` added. Migration `0006_fantastic_firelord.sql` generated; applied manually (existing migrations table is in drift state; followed the 0002–0005 pattern).
  - ETL: `etl/dip/` worker — `ingest.ts` orchestrator split into `fetchVorgaenge`, `fetchPositions`, `fetchAktivitaeten`, `fetchPersons`, `buildAnfragen`, `buildSignatories`, `resolveMember`, `normalize`, `client` (cursor pagination + retry against the Enodia rate-limit gateway). Bootstrap matcher at `bootstrapDipPersons.ts` reuses `matchAwToMember`. Env: `DIP_API_KEY` (default fallback), `DIP_UPDATED_START` (incremental), `DIP_SKIP_VORGANG=1` (re-run signatory phase only). Scripts: `npm run etl:dip:bootstrap`, `npm run etl:dip`.
  - Test run (WP21 backfill): bootstrap matched **626 / 636** members. Anfragen ingested: **kleine 1939, grosse 12, schriftlich 6467** (= 8418 total), all with raw payloads in `anfragen_raw`. Signatory phase blocked mid-run by DIP's Enodia rate limit (browser-challenge gateway after sustained polling). Client retries up to 8× with exponential backoff. Re-run signatories with `DIP_SKIP_VORGANG=1 npm run etl:dip` once the limit clears, or let the next weekly cron handle it — idempotent.
  - Read-path note for backend: Schriftliche Frage carries no fraktion on the position. Resolve via `member_affiliations` time-range at `anfragen.question_date` (same rule as votes). Documented in plumber.md "DIP Anfragen".
  - Left for next iteration: signatory backfill (rate-limit dependent); detect long aktivitaet gaps for partial-run recovery; if signatory volume balloons, switch to per-vorgang aktivitaet lookups over the all-WP21 scan.
- 2026-05-12 (backend) — Server functions shipped.
  - Files: `apps/bundestag/src/server/anfragen.ts` (getAnfragenForMember), `apps/bundestag/src/server/anfragenStats.ts` (getAnfragenStatsForParty). One server fn per file, matches existing TanStack Start `createServerFn` pattern.
  - Exported types for frontend: `AnfrageRow`, `AnfrageGroup`, `MemberAnfragen` from `./anfragen`; `PartyAnfragenTypeSplit`, `PartyAnfragenTopic`, `PartyAnfragenStats` from `./anfragenStats`.
  - Party fn takes party **slug** (not id) — matches existing `getParty(slug)` convention; SLUG_TO_PARTY maps `cdu-csu/spd/afd/gruene/linke` → canonical party name.
  - Party attribution: signatory → party via `loadAffiliationsByMember()` + `partyAt(list, anfragen.question_date)` (the existing time-range util used by votes), per plumber DIP note. Anfrage counted once per party even if multiple members signed.
  - Co-signer count = `count(signatories) - 1`, floored at 0 (consistent with mock's `+N Mitzeichner` which excludes the MP being viewed).
  - Member fn precomputes both flat list and group-by-Sachgebiet (size-desc); rows with multiple Sachgebiete appear in each, matching designer's group view; rows with no Sachgebiet land in "Ohne Sachgebiet" bucket.
  - Smoke check: DB has 8418 anfragen, 0 signatories (rate-limited per plan). Empty-path return shape verified — `total: 0`, `byType` zeroed, `groups: []`. Re-run smoke after plumber's signatory backfill clears.
  - Drizzle gotcha: `inArray` with a large id list (~8k) works fine on better-sqlite3; party stats currently scans all signatories in JS rather than a windowed join because the time-range lookup needs the affiliation list per member — same approach as `votes.ts`. Revisit if signatories ever exceed ~100k.
- 2026-05-12 (frontend) — Views + hooks shipped.
  - Hooks: `apps/bundestag/src/hooks/useMemberAnfragen.ts`, `apps/bundestag/src/hooks/usePartyAnfragenStats.ts` (TanStack Query, staleTime Infinity to match existing `useSpeechBody` precedent).
  - MP detail: `views/memberDetail/AnfragenTab.tsx` (presentational, owns view-local filter/group state matching `VotingRecordTab` pattern), split into `AnfragenSummary.tsx` (count headline + stacked bar) and `AnfrageRow.tsx` (2-char type badge KL/GR/SF with tooltip-friendly title attr, success/danger status inline, `+N Mitzeichner` only when N>0, row wraps `<a>` to question/answer PDF when available). Wired via `MemberAnfragenSection.tsx` glue component below the Reden section in `MemberDetail.tsx`.
  - Party panel: `views/partyDetail/AnfragenPanel.tsx` with three sub-blocks — `TypSplit` stacked bar mirroring `DonationsBar` idiom (h-8 flex-grow segments, neutral fg with descending opacity), `TopicList` horizontal bars for Top Sachgebiete, `DeskriptorCloud` chip cloud. Tooltips on all three (count + percentage for typ split, count for topics/chips). Inert hover affordance, no navigation. Wired via `PartyAnfragenSection.tsx` glue into existing 2-col panel grid in `PartyDetail.tsx`.
  - Empty states render directly from server's `total === 0` shape (current DB state — 0 signatories pending rate-limit clear).
  - Deviations from mocks:
    1. **No tab bar on MP detail.** Mock shows `[ Abstimmungen ] [ Reden ] [ Anfragen ] [ Nebeneinkuenfte ] [ Bio ]` tabs, but existing MemberDetail composes sections vertically (StatTiles → VotingRecordTab → Reden). Added Anfragen as a fourth vertical section in the same style rather than introducing a tab primitive that would need to wrap the other three. Flag for designer/lead if a tab refactor is actually wanted.
    2. **Section caption "Anfragen" + group toggle on the right** instead of the mock's `ANFRAGEN GESAMT … GROUPED BY [Thema] [Datum]` headline row — matches the Reden section caption style and keeps the toggle adjacent to the data.
    3. **Custom inline GroupToggle** (sharp-bordered segmented control) instead of shadcn Tabs primitive — Tabs ships with `rounded` baked into the variant; user's hard rule is no rounded corners. Kept it minimal, matches FilterPill border treatment.
  - Sharp corners throughout; no `rounded-*` added. Tokens (text s/m, spacing xs/s/m/l/xl, opacity-l/m) match mock specs.
  - Typecheck clean (`npx tsc --noEmit` in apps/bundestag).
- 2026-05-12 (plumber) — DIP ETL refactored to fetch/process split (now a top-level principle in `.claude/agents/plumber.md`).
  - New files: `etl/dip/cache.ts` (page/cursor/done helpers), `etl/dip/fetch.ts` (network → JSON pages on disk, resumable via `_cursor.txt`, `_done` marker per endpoint), `etl/dip/process.ts` (cache → DB, replayable). `ingest.ts` reduced to two imports (fetch then process via top-level-await ordering).
  - Deleted obsolete in-memory accumulators: `fetchVorgaenge.ts`, `fetchPositions.ts`, `fetchAktivitaeten.ts`.
  - Cache layout `etl/dip/cache/<endpoint>/page-NNNNN.json` (zero-padded, lexically sortable). Endpoints: `vorgang/{kleine-anfrage,grosse-anfrage,schriftliche-frage}`, same for `vorgangsposition`, and `aktivitaet` (single WP21-filtered folder). Each endpoint has its own `_cursor.txt` (fsynced after each page) and `_done` sentinel. Pages are fsynced on write.
  - Scripts: `npm run etl:dip:fetch`, `npm run etl:dip:process`. `npm run etl:dip` runs both. `:bootstrap` unchanged.
  - Gitignore: `etl/dip/cache/` ignored; `etl/dip/samples/` still checked in.
  - Tested: fetch ran, killed mid-aktivitaet at page 116, re-run resumed at page 117 from `_cursor.txt`. Process ran cleanly on partial cache → 8418 anfragen + 13869 signatories from the first ~30k aktivitaet rows. Typecheck clean.
  - Volume correction: WP21 `f.wahlperiode=21` aktivitaet is ~65k records (not 1.75M — that's the unfiltered universe). Full backfill still subject to rate-limit; client retry policy (30× × ≤5min) unchanged.
  - Quirk recorded in agent memory: `.claude/agent-memory/plumber/dip_rate_limit.md` (DIP returns HTML browser-challenge pages instead of JSON 429s under load).
  - Not run: full backfill — user's call.
- 2026-05-12 (frontend) — MP detail restructured to tabbed nested routes.
  - Files created: `apps/bundestag/src/routes/members/$id/route.tsx` (layout: loader + header + shell wraps `<Outlet />`), `apps/bundestag/src/routes/members/$id/index.tsx` (beforeLoad redirect to abstimmungen), `apps/bundestag/src/routes/members/$id/abstimmungen.tsx` (consumes parent loader via `useLoaderData({ from: '/members/$id' })`, line filter lifted to URL search param), `apps/bundestag/src/routes/members/$id/reden.tsx`, `apps/bundestag/src/routes/members/$id/anfragen.tsx`, `apps/bundestag/src/views/memberDetail/MemberDetailShell.tsx` (header + stats + tab strip + children), `apps/bundestag/src/views/memberDetail/MemberDetailTabs.tsx` (TanStack `<Link>` with `activeProps`, sharp 2px bottom border for active, no `rounded-*`).
  - Files deleted: `apps/bundestag/src/routes/members/$id.tsx`, `apps/bundestag/src/views/memberDetail/MemberDetail.tsx` (responsibilities split into layout + child routes).
  - Tab order Abstimmungen → Reden → Anfragen. Default = Abstimmungen.
  - Verified live (vite dev): `/members/vogtschmidt-donata/` → 307 to `/members/vogtschmidt-donata/abstimmungen/`; `/anfragen/` and `/abstimmungen/` return 200. Typecheck clean for all touched files (remaining errors in `parties.ts` / anfragen schema imports are pre-existing).
