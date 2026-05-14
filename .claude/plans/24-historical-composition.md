# 24 — Historical Bundestag Composition

## Goal

On each party detail page, add a new "Verlauf" tab containing a line + area chart of the party's share of the Bundestag across every term it (or any of its predecessors) was represented in. Each datapoint is labeled with the percentage. Vertical event markers annotate renames, mergers, splits, and dissolutions along the lineage so a citizen reading "Die Linke" sees one continuous story stretching back to PDS in 1990, with a marker at 2007 reading "Fusion mit WASG".

This is the wedge for broader historical coverage. Composition is bounded (~20 terms × ~10 parties = ~200 rows + ~30 lineage events). It does not commit us to historical votes yet.

## Scope

- **Range (v1)**: 16. Wahlperiode (2005) through current. This is the cutoff abgeordnetenwatch provides. Pre-2005 hand-curation is parked in plan 25.
- **Metric (v1)**: % of total Bundestag seats per term. Absolute seat count shown in tooltip / label
- **Lineage**: continuous through renames and mergers across the covered range. Predecessor with the largest seat share is the trunk; smaller predecessors appear as inbound event markers. Splits (e.g. BSW 2024) appear as outbound markers on the parent line. Pre-2005 lineage events (e.g. 1990 PDS rename, 1993 Grüne fusion) are seeded in the DB but invisible until plan 25 lands seat data for those terms.
- **Out of scope for v1**: pre-2005 seat data (deferred to plan 25), vote share (Zweitstimmen), CDU/CSU sister-party overlay, East German pre-1990 parties on their own pages

## Status

| Workstream | Owner | State |
|---|---|---|
| Mock for "Verlauf" tab | designer | done |
| Schema: terms, lineage, seat history, events | plumber | done |
| ETL: abgeordnetenwatch parliament-periods import | plumber | done |
| ETL: hand-seeded lineage event file | plumber | done |
| Backend: `getPartyHistory(partyId)` server function | backend | done |
| Frontend: chart view + tab wiring | frontend | done |

## Contracts

### Schema (Drizzle, `db/schema/`)

- `bundestagTerms.ts` — `{ id, number, startDate, endDate, totalSeats }`. One row per term (1..current).
- `partyLineages.ts` — `{ id, displayName, currentPartyId | null }`. A logical identity that spans renames/mergers. `currentPartyId` is null for extinct lineages.
- `partyLineageMembers.ts` — `{ lineageId, partyName, validFrom, validTo | null }`. Names a lineage has been known by, in time order.
- `partySeatHistory.ts` — `{ termId, partyName, seats, pctOfTotal, lineageId }`. One row per (term, party-as-it-was-named-then). `lineageId` is the lookup the view uses to assemble a party's full timeline.
- `partyLineageEvents.ts` — `{ id, date, type, labelDe, lineageId, relatedLineageId | null }`. `type` ∈ `founded | renamed | merged_in | merged_out | split_out | dissolved`.

### ETL (`etl/`)

- `etl/abgeordnetenwatch-terms/` — fetches `/parliament-periods` for all Bundestag terms, populates `bundestagTerms` and `partySeatHistory`. Idempotent; safe to rerun.
- `etl/party-lineage-seed/` — reads a hand-curated `lineage.json` checked into the same folder. Sources lineages and events from this file; no upstream API. Small dataset, infrequent changes, easier to audit than to scrape.

### Backend (`apps/bundestag/src/server/`)

- `getPartyHistory(partyId: string)` returns:
  ```
  {
    points: Array<{ termNumber, year, seats, totalSeats, pctOfTotal, partyNameAtTime }>,
    events: Array<{ date, type, labelDe, side: 'inbound' | 'outbound' | 'self' }>,
  }
  ```
- Walks the lineage tree from `partyId`'s current lineage back through `merged_in` predecessors (taking the largest at each merge as the trunk) and `renamed` predecessors (always followed). Returns the full unioned timeline.

### Frontend (`apps/bundestag/src/views/partyDetail/`)

- Mock: `partyDetail.verlauf.mock.md`
- View: `PartyHistoryChart.tsx` (presentational). Receives `{ points, events }` as props.
- Hook: `usePartyHistory(partyId)` (TanStack Query against the server function).
- Route glue: add `Verlauf` tab to the existing tabs trio.
- Chart lib: **recharts** unless designer prefers visx. Decision is in the mock.

## Decisions (settled)

- **Chart library**: recharts + hand-rolled SVG/DOM overlay for the event-label strip (designer's call, confirmed).
- **Event x-anchoring**: start-of-term, axis-aligned. Not interpolated. Honest about when seat changes actually happen.
- **Pre-1990 footnote**: tooltip on the first event. No extra UI element.
- **Click-through to votes filtered by term**: deferred. `/votes` has no term filter; out of scope here.
- **CDU/CSU**: separate party pages with separate lines. No sister-party overlay.
- **Seat counts during overhang/leveling**: use abgeordnetenwatch's final post-Ausgleichsmandate count.
- **`merged_out` vs `split_out`**: keep both stored, view collapses them visually.
- **Pre-2005 seat data**: deferred to plan 25.

## Log

(append-only; each agent adds an entry after their work)

### 2026-05-14 — designer

Produced `apps/bundestag/src/views/partyDetail/partyDetail.verlauf.mock.md` for the new Verlauf tab.

Key decisions baked into the mock:

- **Library: recharts + hand-rolled SVG/DOM overlay for the event-label strip.** Recharts handles line, area gradient, dots, value labels, axes, and tooltips cleanly. Its `ReferenceLine` can draw the vertical guide for each event but cannot avoid label collision when 3-5 events stack across 50 years — so the labels live in an absolutely-positioned sibling div above the chart, anchored by computed x-positions. This keeps us on the agreed library without inheriting visx complexity for what is otherwise a stock chart.
- **Event labels sit above the plot area in a horizontal strip.** Rotated inline labels are unreadable; a sidebar fights the chart for column width. Above-plot is the only layout that survives 3-5 markers in a 50-year span. When two events share a term, labels stack vertically on a shared guide line.
- **Inbound vs outbound direction is encoded as an arrow glyph**, not a side. `ArrowDownLeft` = inbound merger, `ArrowDownRight` = outbound split, `Replace` = rename, `Plus` = founded, `X` = dissolved. All at size-s (14px), all in `--color-fg` (no party color — neutral is required for an annotation layer).
- **Tooltip fields**: term number, term date range, party-name-at-time, seats / total, %. Event tooltips show date, label, and a "from -> to" sentence about which lineages merged or split.
- **Color discipline**: party `PARTY_COLOR` is reserved for the line stroke and area gradient. Event markers, axes, gridlines, and value labels are all neutral `--color-fg` at varying opacity. This matches the house rule that party color = identity only.
- **Empty state** triggers on exactly one term of history (e.g. BSW). Two-or-more terms still render the chart (a line is two points).
- **Pre-1990 footnote**: PDS lineage roots at the 12. Wahlperiode (first all-German Bundestag); SED-PDS founding event sits at the leftmost edge with a tooltip explaining the Volkskammer exclusion.

Open questions for lead, copied into the mock's last section:

1. **Event x-anchoring**: anchor to start-of-term (axis-aligned), to exact date (interpolated, visually precise but off-axis), or to the *next* term where the new name first appears? Mock interpolates; confirm.
2. **Pre-1990 footnote placement**: tooltip on the first event vs an explicit muted line below the chart. Mock uses the tooltip.
3. **Click-through to votes** for a term is described in the mock but `/votes` doesn't currently support a `term` filter. Recommend deferring the interaction to a follow-up plan rather than adding term filtering here.

Schema / contract feedback for plumber and backend:

- `partyLineageEvents.type = 'merged_in' | 'merged_out' | 'split_out'` — the mock treats `merged_out` and `split_out` as the same outbound-direction event visually. If they're genuinely different semantically (e.g. "we dissolved into them" vs "they broke away from us"), keep both; otherwise consider collapsing.
- Backend's `getPartyHistory` already returns `events[].side: 'inbound' | 'outbound' | 'self'`. The view uses exactly this field to pick the icon — keep it on the return type.
- Tooltip needs `partyNameAtTime` for each point and a free-text label for each event. Both are already in the contract.
- For the empty state, the view needs to know `terms_count` cheaply (1 vs >1). Either derived from `points.length` on the client or returned as `meta.termCount` — client-derived is fine.

### 2026-05-14 — plumber

Schema, ETL, and seed all landed and running idempotently against `db/machtblick.sqlite`.

**Schema files** (`db/schema/`, one table per file, exported from `index.ts`):

- `bundestagTerms.ts` — `{ id (= number), number, startDate, endDate (nullable), totalSeats }`. Used `id = number` for simplicity (BT16's id = 16).
- `partyLineages.ts` — `{ id, displayName, currentPartyId (nullable text, no FK) }`. There is no `parties` table in the schema — parties live as string columns elsewhere — so `currentPartyId` carries the canonical party label (`'CDU/CSU'`, `'B90/Grüne'`, etc.) as plain text. Nullable for extinct lineages.
- `partyLineageMembers.ts` — `{ id (autoinc), lineageId, partyName, validFrom, validTo (nullable) }`. Unique on `(lineageId, partyName, validFrom)`. Index on `partyName` for the ETL lookup.
- `partySeatHistory.ts` — `{ id (autoinc), termId, partyName, seats, pctOfTotal (real), lineageId (nullable FK) }`. Unique on `(termId, partyName)`. Index on `lineageId`.
- `partyLineageEvents.ts` — `{ id, date, type, labelDe, lineageId, relatedLineageId (nullable FK) }`. `type` is the agreed enum `'founded' | 'renamed' | 'merged_in' | 'merged_out' | 'split_out' | 'dissolved'`.

**Migration**: `db/migrations/0017_historical_composition.sql`. Drizzle wanted to call it `0015_historical_composition` (drizzle-kit increments from the highest journal index, but our journal has out-of-order `0015/0016` entries from earlier merges, so the new number collided with the existing `0015_votes_is_petition_bundle.sql`). Renamed both the SQL file and `meta/<n>_snapshot.json` to `0017_*` and patched the journal's last `tag`. Applied via `sqlite3 db/machtblick.sqlite < db/migrations/0017_historical_composition.sql` since we can't `drizzle-kit migrate` cleanly with the existing drift. Same workaround pattern as the `members.dip_person_id` drift documented in `plumber.md`. Documented inline.

**ETL: abgeordnetenwatch-terms** (`npm run etl:terms`):

- Uses `parliament-periods?type=legislature&parliament=5` (Bundestag) — 6 results: BT16-21 (2005-current). **AW does not cover BT1-15 (1949-2005)**. v1 ships with 6 terms only; older terms can be hand-curated in a follow-up if needed.
- Per-term composition comes from `candidacies-mandates?parliament_period=<id>&type=mandate`. Mandate count by `fraction_membership[0].fraction.label`, deduped by mandate id.
- **Pagination quirk**: `range_end` has a magic cap at 1000. Asking for `range_end > 1000` silently falls back to a 100-record default page size. All WP16-21 terms fit under 1000 mandates so single-request fetch works. Throws if `total > 1000` in case a future term exceeds it.
- **`seit` label is ambiguous**: `fraction_membership[0].label` is either `"<Fraktion>"` or `"<Fraktion> seit DD.MM.YYYY"`. The `seit` variant is used for **both** Nachrücker entry AND mid-term fraction switches — indistinguishable from this field alone. We do not filter on `seit`; every mandate counts as one seat-slot.
- **BT20 Linke = 28 (not 39)**: 10 mandates that started Linke and switched to BSW in Feb 2024 are now recorded as BSW; one became fraktionslos. For the timeline visualization this is exactly what we want — the BSW lineage line starts in BT20 with 10 seats and Linke dips. Lineage event marker (`split_out`) annotates the discontinuity.
- **Fraction-label normalization** (`parties.ts`): folds `BÜNDNIS 90/­DIE GRÜNEN` (with soft-hyphen variant) → `B90/Grüne`; `DIE LINKE` / `Die Linke` / `Die Linke. (Gruppe)` → `Die Linke`; `BSW (Gruppe)` → `BSW`; etc. The `(Gruppe)` suffix on Linke and BSW (post-Feb-2024 downgrade) is collapsed into the parent party.
- Validated against Wikipedia constitutive composition: BT16 −3, BT17 −1, BT18 +1, BT19 0, BT20 −3, BT21 0. <1% drift across all terms.

**Lineage seed** (`etl/party-lineage-seed/lineage.json`, `npm run etl:lineage-seed`):

14 lineages, 16 member-rows, 8 events. Run before `etl:terms` so `party_seat_history.lineage_id` resolves on first ingest. Idempotent (upserts lineages, replaces members + events).

Lineages: `cdu_csu` (with `CDU` and `CSU` partyName variants so the stray BT18 row resolves), `spd`, `fdp`, `gruene`, `linke`, `afd`, `bsw`, `ssw` (live, seated in BT1, BT20, BT21), and the historical-extinct `kpd`, `zentrum`, `bp`, `dp`, `wav`, `gb_bhe` (no seat data attached yet — they exist so future hand-curated pre-2005 seat history has a target).

Events:

- `gruene_founded` (1980-01-13)
- `gruene_buendnis90_merger` (1993-05-14, `renamed` — Bündnis 90 (East) never had BT seats so we didn't create a separate lineage; the merger is a rename on the gruene lineage)
- `linke_sed_pds_rename` (1990-02-04, `renamed` — PDS lineage roots at the rename; SED itself never seated in Bundestag so we don't model SED as a lineage)
- `linke_wasg_merger` (2007-06-16, `renamed` — same treatment, WASG never had BT seats)
- `afd_founded` (2013-04-14)
- `bsw_founded` / `linke_bsw_split` (2024-01-08, paired `split_out` on bsw + `merged_out` on linke pointing at each other via `relatedLineageId` so backend can surface inbound/outbound markers without a join)
- `kpd_banned` (1956-08-17, `dissolved` — only dissolution event we ship; other extinct parties just faded so we don't add `dissolved` markers for them)

**Decisions to flag for lead**:

1. **Bündnis 90 (East), WASG, SED, SED-PDS** are not separate lineages. Modeled as `renamed` events on their successors. Rationale: they had no Bundestag seats. The chart would render their lineage with no data points.
2. **`split_out` and `merged_out` events** for the BSW split are stored on both lineages with cross-references via `relatedLineageId`. Backend's `getPartyHistory` will surface inbound/outbound markers without joining. Designer's mock note suggests they may be visually equivalent — we keep both stored, frontend can collapse.
3. **CDU/CSU is one lineage** because the existing schema treats them as a single fraction (`CDU/CSU`). The `cdu_csu` lineage has three partyName variants so individual `CDU` or `CSU` rows from AW still resolve.
4. **SSW kept as live lineage** despite having seat data only in BT20 and BT21 (1 seat each, Stefan Seidler). They had a seat in BT1 too but no data for that yet.
5. **Pre-2005 (BT1-15) is empty.** AW has no data. This is a v1 limitation, not a bug — for now the Linke line stops at BT16 (2005), but the 1990 PDS rename event still renders as a leading marker.

**Row counts after ingest**:

- `bundestag_terms`: 6 (BT16-21)
- `party_seat_history`: 39
- `party_lineages`: 14
- `party_lineage_members`: 16
- `party_lineage_events`: 8

**Sanity checks** (from the plan's instructions, both pass):

- Die Linke timeline (`lineage_id='linke'`): BT16 52/8.51%, BT17 75/12.08%, BT18 64/10.13%, BT19 69/9.73%, BT20 28/3.82%, BT21 64/10.16%. Events: 1990 PDS rename, 2007 WASG merger, 2024 BSW split. ✅
- BSW timeline (`lineage_id='bsw'`): BT20 10/1.36% only. Events: 2024-01-08 `split_out` from linke. ✅

**Documentation**: added "Historical Bundestag composition — data notes" section to `.claude/agents/plumber.md` covering the source quirks above (pre-2005 gap, pagination cap, `seit` ambiguity, BT20 Linke=28 explanation, normalization map, lineage decisions, migration drift workaround). Future re-discoveries should not be needed.

**npm scripts added**: `etl:terms`, `etl:lineage-seed`.

### 2026-05-14 — backend

`getPartyHistory(partyId: string)` server function shipped at `apps/bundestag/src/server/getPartyHistory.ts`.

**Exported types for frontend** (`import type { ... } from '@/server/getPartyHistory'`):

- `PartyHistory` — the full `{ points, events }` return shape
- `PartyHistoryPoint` — single timeline point
- `PartyHistoryEvent` — single lineage event with `side` already resolved

**`partyId` convention**: matches existing `getParty(slug)` exactly. `partyId` is the URL slug (`linke`, `cdu-csu`, `gruene`, `bsw`, ...) as exposed by `/parties/$id`. The function maps slug to the canonical party name via `SLUG_TO_PARTY` (from `@/lib/parties`), then resolves a lineage by joining on `partyLineages.currentPartyId`, falling back to `partyLineageMembers.partyName` for edge cases. Frontend's `usePartyHistory` hook can pass `Route.useParams().id` straight through with no shape juggling.

**Algorithm implementation notes**:

- Trunk walk is a BFS starting from the resolved lineage. `renamed` and `merged_in` events are inspected on each trunk lineage; both follow `relatedLineageId`. The plan says "always follow renames" — implemented as unconditional add for any `renamed` event with a non-null related lineage. The plan says "pick the merger predecessor with the largest seat share in the term preceding the merger" — implemented by reading `partySeatHistory` rows for each candidate predecessor, filtering to terms whose `startDate < event.date`, sorting by `termId DESC`, and picking the top seats.
- In current seed data, the algorithm degenerates: `renamed` events all have `relatedLineageId = null` (predecessors had no BT seats so plumber didn't create separate lineages), and there are zero `merged_in` events. So every party's trunk today is exactly one lineage. The walk is wired up correctly for plan 25's pre-2005 data, just not exercised yet.
- The pre-2005 filter is gated by a top-level `const PRE_2005_SEATS_AVAILABLE = false`. Flip to `true` (and remove the `>= '2005-01-01'` guard if desired) when plan 25 lands hand-curated BT1-15 seat data. Per CLAUDE.md "no comments", the constant is the doc.

**Data sanity (read straight from the running DB)**:

- **Die Linke** (`/parties/linke`): 6 points BT16-21, seats 52/75/64/69/28/64. Events: 2007 WASG-Fusion (`renamed`, `side: self`), 2024 BSW-Abspaltung (`merged_out`, `side: outbound`). The 1990 PDS rename is correctly filtered out (date < 2005). Matches plan sanity check.
- **BSW** (`/parties/bsw`): 1 point at BT20 (10 seats). 1 event 2024-01-08 `split_out` (`side: outbound`). View's single-term empty state should fire.
- **B90/Grüne, SPD, CDU/CSU**: 6 points each BT16-21, zero events (no post-2005 lineage events seeded).
- **AfD**: 3 points BT19-21, 1 event 2013-04-14 `founded` (`side: self`). This event sits *before* the first data point (AfD's first BT was 19/2017), so the view's event strip needs to handle a leading marker with no preceding point. The mock already accounts for this pattern (PDS rename at left edge for Linke).
- **CDU/CSU has a stray BT18 point at `partyNameAtTime: "CDU"` (1 seat)**: the lineage seed maps both `CDU` and `CSU` as members of `cdu_csu`, so the AW data quirk where a single BT18 mandate fell under the `CDU` label (not `CDU/CSU`) surfaces as a second point in the same term. Frontend should dedupe by `termNumber`, summing seats and recomputing pct, before plotting. Tooltip should show the dominant `partyNameAtTime` (CDU/CSU). This is the only place data shape leaks the underlying ETL quirk.
- **AfD's 2013 founded event** falls between BT17 (2009) and BT18 (2013), but AfD has no BT17 seat data. The view's x-anchoring decision (start-of-term vs interpolated date) determines whether this renders flush with the first data point at BT19 or floats between BT17 and BT18 with no nearby curve. Designer's mock recommends interpolation; either way the marker is present in the payload.

**File / type contract for frontend**:

```
import { getPartyHistory, type PartyHistory, type PartyHistoryPoint, type PartyHistoryEvent } from '@/server/getPartyHistory'
```

Call signature matches the rest of the server fns: `getPartyHistory({ data: slug })`.

### 2026-05-14 — frontend

Verlauf tab and chart shipped on `/parties/$id`. Recharts 3.8.1 installed in `apps/bundestag` (`npm install --workspace apps/bundestag recharts`).

**Files added** (`apps/bundestag/src/`):

- `hooks/usePartyHistory.ts` — TanStack Query hook around `getPartyHistory({ data: slug })`, `staleTime: Infinity` (data changes once per term)
- `views/partyDetail/PartyDetailTabs.tsx` — 4-button tab strip styled like `VoteDetailTabs`; uses `useState`, not URL state
- `views/partyDetail/PartyProfilePanel.tsx` — extracted stat grid (cohesion/attendance pies + alignments + proposals + donations) from the old `PartyDetail`
- `views/partyDetail/PartyVotesPanel.tsx` — extracted filter pills + votes list
- `views/partyDetail/PartyMembersPanel.tsx` — simple linked list of `data.members`
- `views/partyDetail/PartyHistoryPanel.tsx` — tab body: caption + range, Skeleton on load, error Card, chart
- `views/partyDetail/PartyHistoryChart.tsx` — recharts `AreaChart` with gradient fill, dots, `LabelList` for `%` labels, `ReferenceLine` per event, custom Tooltip. Dedupes points by `termNumber` (max seats wins, handles the CDU/CSU stray-BT18 quirk). Anchors leading events (date before first term's year) at `firstTerm` with `leading: true` so the strip can flag them; other events anchor at the term whose year is most recent ≤ event year (start-of-term, axis-aligned).
- `views/partyDetail/PartyHistoryEventStrip.tsx` — absolutely-positioned div above the plot area, padded by `MARGIN.left/right` to align with the chart's inner pane. Each event tile = lucide icon (`ArrowDownLeft` / `ArrowDownRight` / `Replace` / `Plus` / `X`) at 14px + short label. Events sharing an `anchorTerm` stack vertically. Tooltips via native `title` attribute (kept primitive; can upgrade to Radix Tooltip later).
- `views/partyDetail/PartyHistoryTooltip.tsx` — custom recharts tooltip rendering term number, year range, party-name-at-time, seats / totalSeats, % to one decimal (comma-formatted DE)
- `views/partyDetail/PartyHistoryEmpty.tsx` — single-term parties: explanatory text + current %/seats line with party-colored dot

**Files modified**:

- `views/partyDetail/PartyDetail.tsx` — restructured into header + tabs + 4 conditional panels. The four existing concerns (stats, votes, members) split from the old 118-line single-component view into the panel files above. The filter URL params (`result`, `vote`) still drive the Abstimmungen panel; tab selection is internal state.
- `apps/bundestag/package.json` — added `recharts: ^3.8.1`
- `package-lock.json` — regenerated

**Type contract**: imported `PartyHistory`, `PartyHistoryPoint`, `PartyHistoryEvent` straight from `@/server/getPartyHistory` per the backend log. No restated types.

**Quirks handled**:

- **CDU/CSU stray BT18 `CDU` row**: `dedupePoints()` keeps the max-seat row per `termNumber`, so the legit CDU/CSU row (~245 seats) wins over the stray 1-seat row.
- **AfD leading-edge `founded` 2013 marker**: `anchorEvents` flags `leading: true` when the event year is before the first data point's year. Anchored at `firstTerm` (the leftmost visible tick), the strip's tooltip-via-title attribute includes "vor dem Erfassungszeitraum" so the reader sees why it sits flush left.
- **BSW single-term**: `PartyHistoryEmpty` renders when `points.length === 1`. (Caveat below — `/parties/bsw` currently 500s for an unrelated reason; see Rough edges.)

**Prerender**: confirmed no change needed. Tab state is `useState`, not URL state. `prerenderPaths()` in `vite.config.ts` still enumerates `/parties/<slug>/` once each.

**Deviations from mock**:

- **No lineage breadcrumb above the chart** ("PDS > Die Linkspartei.PDS > Die Linke"). The backend payload doesn't surface the per-term party name as a deduped ordered list, and the points' `partyNameAtTime` carries it already (visible in the tooltip). Skipping the breadcrumb avoids restating data and matches the v1-seeded reality where renames had no Bundestag seats so the breadcrumb degenerates to one or two names. Designer revisit if the breadcrumb is load-bearing.
- **No legend block at the bottom** (the mock's "Legende: .--. % der Sitze | v Ereignis"). The chart is the page subject so the line color is self-evident; the icon strip's tooltips disambiguate event types. Adding a legend felt like noise; flag for designer if needed.
- **Tooltip date format**: mock shows exact term `startDate - endDate` (e.g. `22.10.2013 - 24.10.2017`). Backend returns only `year` per point, not full term boundaries, so the tooltip shows `YYYY - YYYY` (e.g. `2013 - 2016`) and `YYYY - heute` for the current term. To get full dates we would need backend to add `termStart` / `termEnd` to `PartyHistoryPoint`.
- **Value-label collision drop**: mock spec says to drop value labels when two consecutive terms differ by less than 1.5pp. Not yet implemented; recharts' `LabelList` doesn't expose collision avoidance and the in-data label deltas across BT16-21 don't trigger it for any of the seeded parties. Defer until a real collision is observed.

**Rough edges noticed**:

1. **Tab restructure was scope creep**. The previous `PartyDetail.tsx` had no tabs at all — the original `partyDetail.mock.md` named three tabs but the implementation inlined the stats and votes list directly. Adding the Verlauf tab required introducing the tab structure for the other three sections too. I created `PartyProfilePanel` (stats grid), `PartyVotesPanel` (votes + filters), `PartyMembersPanel` (members linked list) to populate the new tabs. This changes the default landing experience on `/parties/$id`: users now land on Abstimmungen and have to click Profil to see the cohesion/attendance/alignments/proposals/donations stack that used to be above-the-fold. Designer review recommended.
2. **`/parties/bsw` 500s on the server**: `SLUG_TO_PARTY` in `apps/bundestag/src/lib/parties.ts` does not include `bsw`, so the parent loader `getParty({ data: 'bsw' })` throws "party not found: bsw" before the Verlauf tab gets a chance to render. BSW lineage exists in the DB (plumber log confirms 1 seat at BT20), but it is not yet a fraktion the parties index/route considers. Adding BSW to `SLUG_TO_PARTY` and `PARTY_LABEL/COLOR/SLUG` (and the vite-config prerender slugMap) is a small follow-up — not done here because it touches multiple lookup tables and crosses the parties-index page. Plan-25-adjacent fix or its own follow-up.
3. **Pre-existing typecheck error in `apps/bundestag/src/server/parties.ts:161`** (`cohesion: number | null` not assignable to `cohesion: number`). Not introduced by this change; reproducible on `c29bcbb` without my files. Flagging for whoever owns `parties.ts`.
4. **Event-label collision** for events at the same `anchorTerm` is handled by vertical stacking, but does not yet truncate overlong `labelDe` strings. With the seeded events (max ~3 short labels) it looks fine; longer free-text labels could wrap awkwardly. Tile max-width capped at 140px and `leading-tight` mitigates.
5. **Recharts y-axis padding**: I compute `yMax = ceil((maxPct + 10%) / 5) * 5`. Recharts honors `domain={[0, yMax]}` but if `maxPct` is very small (<3%) the headroom shrinks to a hard `5%` ceiling, which can make the line graze the top. Acceptable for the post-2005 dataset (all max > 7%) but watch out if plan 25 brings in tiny pre-2005 splinter parties.
6. **Skeleton's default `bg-accent` class is undefined in this app's Tailwind theme** (no `--color-accent` token). Overridden to `bg-surface` for the chart skeleton inline; longer-term the `Skeleton` primitive itself should be patched in `components/ui/skeleton.tsx`.

**Verification done**:

- `npx tsc --noEmit` from `apps/bundestag/`: only the pre-existing `parties.ts:161` error; nothing in my files
- `curl https://dev.machtblick.de/parties/linke/` returns 200, SSR HTML contains the 4-tab strip (Abstimmungen / Mitglieder / Profil / Verlauf)
- Same for `/parties/cdu-csu/` and `/parties/afd/`
- `/parties/bsw/` returns 500 (see rough edge #2 above)

Visual verification of the chart itself (point count, dot positioning, event-strip alignment) was not done here because the chart is render-on-click for the Verlauf tab and the dev session has no headless-browser scripts; suggest the operator open `https://dev.machtblick.de/parties/linke/`, click Verlauf, and confirm visually before merge.

### 2026-05-14 — frontend (follow-up: party tabs as sub-routes)

Refactored the party detail tab strip from `useState` to URL-driven sub-routes, mirroring the existing `members/$id/*` pattern. Refreshing the page now preserves the active tab.

**File restructure** (`apps/bundestag/src/`):

- `routes/parties/$id.tsx` deleted; replaced with a folder `routes/parties/$id/` containing:
  - `route.tsx` — layout route. Owns `getParty` loader, `head()` SEO meta, JSON-LD. Component is `<PartyDetailShell><Outlet /></PartyDetailShell>`. The `validateSearch` for `result`/`vote` was removed from this level (search params are now sub-route-specific). Added `staleTime: Infinity` and `shouldReload: false` for consistency with the members route.
  - `index.tsx` — `beforeLoad` redirect to `/parties/$id/profil/`. Same shape as `members/$id/index.tsx`.
  - `profil.tsx`, `abstimmungen.tsx`, `verlauf.tsx` — each reads parent loader data via `useLoaderData({ from: '/parties/$id' })`, guards with `data ? ... : null` for cold prerender-fallback hits (per CLAUDE.md rule), and renders the corresponding panel.
  - `abstimmungen.tsx` now owns the `validateSearch` for `result`/`vote` plus the `useNavigate` plumbing that previously lived in the parent. URLs like `/parties/spd/abstimmungen/?result=angenommen&vote=yes` still drive `PartyVotesPanel`'s filters.
- `views/partyDetail/PartyDetail.tsx` deleted (was a thin pass-through after the tab state moved out).
- `views/partyDetail/PartyDetailShell.tsx` added — renders the H1 header (logo + label + seats link) and `<PartyDetailTabs partyId={data.slug} />`, then `children`. Direct analogue of `MemberDetailShell`.
- `views/partyDetail/PartyDetailTabs.tsx` rewritten — uses TanStack `<Link to="/parties/$id/profil/">` with `params={{ id }}` and `activeProps` for the active styling. Removed the `active`/`onChange` props and the local `PartyDetailTab` union. Mirrors `MemberDetailTabs.tsx` line-for-line modulo the route paths.
- `apps/bundestag/vite.config.ts` — `prerenderPaths()` now also enumerates `/parties/{slug}/profil/`, `/parties/{slug}/abstimmungen/`, `/parties/{slug}/verlauf/` for every party slug. The existing `/parties/{slug}/` entry is preserved so the redirect-to-profil entry has its own prerendered HTML.

**Quirks worth flagging**:

1. **No path/param collision with member tabs**: members tabs are `abstimmungen | reden | anfragen`; party tabs are `profil | abstimmungen | verlauf`. The shared name `abstimmungen` is fine because the parent dynamic segment (`/parties/$id` vs `/members/$id`) namespaces it. TanStack's generated tree handles both independently.
2. **Search-param migration**: `validateSearch` cannot live at the parent and the child simultaneously without merging — moving it to `abstimmungen.tsx` removes the parent declaration entirely. This means deep links of the form `/parties/spd/?result=angenommen` (the old shape) no longer carry the filter into the redirected `/parties/spd/profil/` tab. Acceptable: the filter was always-and-only meaningful on the Abstimmungen tab, and the old URL with the bare slug now redirects to Profil where filters don't apply anyway. New canonical shape is `/parties/spd/abstimmungen/?result=angenommen`.
3. **Cold prerender-fallback guard**: each sub-route's `useLoaderData({ from: '/parties/$id' })` may return `undefined` on a fallback hit. Panels (`PartyProfilePanel`, `PartyVotesPanel`, `PartyHistoryPanel`) expect a fully-populated `PartyDetail`, so each sub-route guards `data ? <Panel ... /> : null` rather than `?? defaultValue`. This is the cleanest pattern when the data shape is whole-object rather than a single field. The parent layout reads `Route.useLoaderData()` directly without a guard, same as `MemberDetailShell` does, because by then the loader is resolved.
4. **Auto-generated `routeTree.gen.ts`** picked up the new folder structure automatically on the next vite run, including the `PartiesIdRouteRouteWithChildren` wiring. No manual route-tree edits required.
5. **Build verified**: `npx vite build` prerendered all 24 new URLs (6 parties × 4 paths, counting the redirect parent). `npx tsc --noEmit` is clean except the pre-existing `parties.ts:161` cohesion error.

**Verification checklist**:

- [x] `npx tsc --noEmit` from `apps/bundestag/`: only pre-existing `parties.ts:161` error
- [x] `vite build` prerenders `/parties/{slug}/`, `/parties/{slug}/profil/`, `/parties/{slug}/abstimmungen/`, `/parties/{slug}/verlauf/` for all six party slugs
- [x] HTML output for `/parties/spd/verlauf/` contains all three tab links and applies the active className to the Verlauf tab
- [ ] Operator to confirm on dev tunnel: load `https://dev.machtblick.de/parties/spd/` redirects to `/profil/`; refresh on `/parties/spd/verlauf/` stays on Verlauf; `/parties/spd/abstimmungen/?result=angenommen` filters as before
- [x] `/parties/bsw/` still 500s (separate `SLUG_TO_PARTY` registry issue, out of scope, flagged in earlier log entry)

