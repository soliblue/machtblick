# 25 — Pre-2005 Bundestag Seat History (deferred extension)

## Goal

Extend the Verlauf chart (plan 24) back to 1949 by hand-curating per-term seat counts for the 1. through 15. Wahlperiode. abgeordnetenwatch's parliament-periods API only covers BT16 (2005) onwards, so the only way to honor the original "Die Linke goes back to PDS in 1990, with markers at the 2007 fusion" vision is to type the numbers in from authoritative printed sources.

## Why deferred

V1 of plan 24 ships with a 2005-onwards chart and the lineage events for pre-2005 mergers/renames already seeded in the DB but invisible. This plan unblocks them. Splitting the work means v1 ships sooner and the data-entry effort is decoupled from the schema/view risk.

## Scope

- 1. through 15. Wahlperiode (1949–2005)
- Per-term: total seats in the Bundestag, seat count per Fraktion at constitutive session
- Same `partySeatHistory` table as plan 24 — no new schema
- Same lineage seed as plan 24 — no new lineage events (those are already there)

## Source

Primary: Bundestag's own historical statistics pages and the "Statistik der Wahl zum N. Deutschen Bundestag" PDFs published per term. Secondary cross-check: Wikipedia's per-term articles (well-cited, generally accurate, but verify against Bundestag if numbers disagree).

Numbers are stable historical record. No scraping, no API. Type them into a JSON file.

## Deliverables

- `etl/bundestag-historical-seats/seats.json` — hand-curated, one block per term: `{ termNumber, startDate, endDate, totalSeats, parties: [{ name, seats }] }`
- `etl/bundestag-historical-seats/ingest.ts` — reads the JSON, upserts into `bundestagTerms` and `partySeatHistory`, links `lineageId` by looking up `partyLineageMembers` by name+date
- Sanity check: after running, query `partySeatHistory` for Die Linke's lineage — should see continuous data from BT12 (1990, as PDS) through current

## Decisions to make when this is picked up

- **CDU/CSU**: in older terms, sometimes reported as a single "CDU/CSU" Fraktion seat count, sometimes split. Match plan 24's convention (separate parties).
- **GB/BHE, BP, DP, Zentrum, WAV, KPD, DZP**: small-party historical Fraktionen that disappeared. Include if they ever had seats (most did, briefly). Lineage already has them seeded as extinct.
- **Group vs Fraktion (Gruppe)**: PDS had Gruppen status in some terms (not enough seats for a Fraktion). Treat the same — `partySeatHistory` records seats, not Fraktion status.

## Status

| Workstream | Owner | State |
|---|---|---|
| seats.json hand-curation | plumber | not started |
| ingest worker | plumber | not started |

## Log

(append-only)
