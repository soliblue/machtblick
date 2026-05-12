# 03 — Party donations (Großspenden) on party detail

## Goal

Show every Großspende ≥35k EUR received by a party in the current legislative period (21. Bundestag, 2025+) on `/parties/$id`, as a horizontal stacked bar: one segment per donation sized by amount, hover/click reveals donor and €. Header shows count and total sum.

## Status

Planning.

## Shared contracts

### Schema (`db/schema/donations.ts`)

```ts
party_donations {
  id: text pk                    // hash of party + donor + date + amount
  party: text                    // matches existing party enum used by votes
  donor: text                    // raw name as published
  donor_address: text | null
  amount_eur: integer            // whole euros
  date_received: text            // ISO yyyy-mm-dd
  date_notified: text            // when president was notified
  source_url: text               // bundestag.de page we scraped
}
```

### Backend addition to `PartyDetail` (`apps/bundestag/src/server/parties.ts`)

```ts
export type PartyDonation = {
  id: string
  donor: string
  amountEur: number
  dateReceived: string
}
donationsTotalEur: number
donationsCount: number
donations: PartyDonation[]   // sorted desc by amountEur
```

### View

`apps/bundestag/src/views/partyDetail/DonationsBar.tsx` — mirrors `ProposalsBar`:
- Header: "Großspenden" left, "N · €X.XM gesamt" right
- Bar: `flex h-8 w-full gap-[2px]`, one `flex-1`-with-style segment per donation, **width proportional to amount** (`flexGrow: amount`)
- Segment color: `--color-fg @ opacity-l` alternating with `--color-fg @ opacity-m` so individuals are distinguishable; donations are identity-neutral facts, no party color, no success/danger
- Tooltip per segment: donor · €amount · date_received
- Shown only if `donations.length > 0`, placed below `ProposalsBar`

## ETL (`etl/bundestag-spenden/`)

- Scrape `https://www.bundestag.de/parlament/praesidium/parteienfinanzierung/fundstellen50000` for the current period section
- Parse the HTML table; one row per donation
- Stable id: `sha1(party|donor|date_received|amount)`
- Idempotent upsert by id
- Run on cron (weekly during session is plenty — page updates within days of receipt)

## Open questions

- None at plan-write time. Threshold and time range confirmed in chat: ≥35k EUR, 21. Bundestag only.

## Log

- 2026-05-12 lead: plan created, scope agreed (≥35k EUR, current period).
- 2026-05-12 frontend: added DonationsBar view, wired into PartyDetail below ProposalsBar; awaits backend fields donations/donationsTotalEur on PartyDetail.
- 2026-05-12 plumber: schema `db/schema/donations.ts` added, migration `0003_neat_marten_broadcloak.sql` generated and `party_donations` table created. ETL `etl/bundestag-spenden/ingest.ts` scrapes 2025 + 2026 year pages, filters `date_received >= 2025-03-25` (21. BT constitution), normalizes party labels via `parties.ts`, upserts idempotently by stable sha1 id. Root script `etl:donations`. First run: 88 donations, 13 parties. Totals: CDU 3.39M, BSW 3.10M, SSW 0.65M, Grüne 0.45M, CSU 0.32M, MLPD 0.32M, AfD 0.15M, FDP 0.15M, Volt 0.15M, SPD 0.15M, Team Todenhöfer 0.12M, Die Linke 50k, DKP 40k EUR. Quirks (installment-date rows, soft hyphens in labels, donor name vs address for institutional donors) documented inline in `plumber.md` under the new Bundestag donations section. Note for backend: donations table separates CDU and CSU, unlike the `votes` enum which combines them as `CDU/CSU` — backend will need to fold the two when populating `PartyDetail.donations` for the CDU/CSU party page.
