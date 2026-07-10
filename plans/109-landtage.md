# 109: Landtage support (berlin.machtblick.de, ...)

## Goal
Extend machtblick beyond the Bundestag to Germany's 16 state parliaments (Landtage), e.g. berlin.machtblick.de, so citizens can see votes, members, and parties of their state parliament with the same design language. First step: understand the data landscape per state, then pick 1-2 pilot states with the best data.

## Status
- research: in progress (agent)
- architecture: todo
- pilot: todo

## Open questions
- Which states have usable machine-readable vote data (roll-call votes especially)?
- Is there a unified source (e.g. abgeordnetenwatch API covers Landtage?) vs 16 bespoke scrapers?
- Subdomain-per-state vs one app with a state switcher?

## Research findings (agent appends here)

### TL;DR
abgeordnetenwatch.de is THE unified source and it is excellent: one CC0 API (`api/v2`) covers all 16 Landtage with full member lists (party + fraction + wikidata id), and its `polls` entity carries genuine PER-MEMBER roll-call ballots (yes/no/abstain/no_show) for state parliaments, same shape as our Bundestag data. Verified live: a Bayern poll returned 203 member votes, a Berlin poll 159. No 16 scrapers needed. The catch is COVERAGE, not shape: abgeordnetenwatch only lists a "redaktionelle Auswahl" of the namentliche Abstimmungen (recorded roll-call votes), and most Landtag votes are by show of hands (Handzeichen, no per-member record exists at the source). So the feed is thin: roughly 10-60 votes per legislative term per state, versus ~160-220 for the Bundestag. Members/parties/hemicycle transfer 1:1; debate transcripts (Reden) and rich motion texts do NOT exist in the aggregator.

### 1. Per-state data availability (abgeordnetenwatch poll counts, verified live 2026-07-09)
Counts are named/roll-call votes documented by abgeordnetenwatch (`/api/v2/polls?field_legislature={periodId}`), all-terms total and current-term. Member data for every state is a FULL mandate list via `/api/v2/candidacies-mandates?parliament_period={id}&type=mandate` (name, party, fraction, sex, year_of_birth, education, occupation, wikidata qid). Quality rating is for OUR need (a per-member roll-call vote feed with an ongoing, current-term stream). Pop = 2024 approx.

| State (Landtag) | Pop | aw polls total | current term | Vote data format | Member data | Quality |
|---|---|---|---|---|---|---|
| Bayern | 13.1M | 278 | 64 (2023-28) | aw per-member roll-call; Bayern holds namentliche often | full via aw | good |
| Nordrhein-Westfalen | 17.9M | 81 | 18 (2022-27) | aw per-member roll-call | full via aw | good |
| Baden-Wuerttemberg | 11.3M | 92 | 0 (165, new 2026-31) / 50 prev | aw per-member; also official CSV of namentliche 2025+ | full via aw | medium (new term ramping) |
| Thueringen | 2.1M | 60 | 10 (2024-29) | aw per-member roll-call | full via aw | medium |
| Hessen | 6.4M | 60 | 4 (2024-29) | aw per-member roll-call | full via aw | medium |
| Brandenburg | 2.6M | 56 | 13 (2024-29) | aw per-member; also Landtag XML doc exports | full via aw | medium |
| Hamburg (Buergerschaft) | 1.9M | 48 | 4 (2025-29) | aw per-member roll-call | full via aw | medium |
| Schleswig-Holstein | 3.0M | 45 | 15 (2022-27) | aw per-member roll-call | full via aw | medium |
| Sachsen | 4.0M | 36 | 3 (2024-29) | aw per-member roll-call | full via aw | medium |
| Mecklenburg-Vorpommern | 1.6M | 28 | 21 (2021-26) | aw per-member roll-call | full via aw | medium (active current term) |
| Niedersachsen | 8.1M | 27 | 4 (2022-27) | aw per-member roll-call | full via aw | medium-poor |
| Berlin (Abgeordnetenhaus) | 3.8M | 26 | 3 (2021-26) | aw per-member; also PARDOK XML (daily, docs only) | full via aw | medium-poor |
| Sachsen-Anhalt | 2.2M | 24 | 14 (2021-26) | aw per-member roll-call | full via aw | medium-poor |
| Bremen (Buergerschaft) | 0.7M | 12 | 5 (2023-27) | aw per-member roll-call | full via aw | poor |
| Rheinland-Pfalz | 4.2M | 11 | 0 (166, new 2026-31) / 5 prev | aw per-member roll-call | full via aw | poor |
| Saarland | 1.0M | 4 | 2 (2022-27) | aw per-member roll-call | full via aw | poor |

Skeptic conclusion confirmed: state parliaments barely publish comprehensive roll-call votes. The per-member DATA is real (not modeled) wherever it exists, because abgeordnetenwatch only records actual namentliche Abstimmungen, but the VOLUME is small and states like Berlin, Saarland, Rheinland-Pfalz rarely hold them. No state exposes an all-votes machine-readable feed; official portals publish plenary protocols as PDF (some XML metadata) and, at best, occasional namentliche-Abstimmung result files (BW CSV 2025+).

### 2. Cross-state aggregators
- **abgeordnetenwatch.de API (`www.abgeordnetenwatch.de/api/v2`) = the answer.** REST/JSON, CC0 1.0, no key. Entities: `parliaments` (18: 16 Landtage + Bundestag + EU), `parliament-periods` (71 legislatures), `politicians`, `candidacies-mandates` (member+fraction+party per period), `polls` (`field_legislature`, `field_poll_date`, `field_accepted`, `field_committees`, `field_topics`, `field_intro` with Drucksache link), and `votes` (per-member ballot, linked to a mandate; `vote` in {yes,no,abstain,no_show}). Fetch ballots via `/polls/{id}?related_data=votes`. Rate limit 30 req/min per IP, bulk 22:00-06:00. This single API delivers our votes feed + members + parties for all 16 states. It does NOT carry speeches/debate transcripts or full motion texts, and photos are absent (only `qid_wikidata`).
- **ParlamentsSpiegel (parlamentsspiegel.de)** = the joint Landtag documentation portal (Vorgaenge/Drucksachen across all states) but it is a SEARCH UI with no download/API interface. Not usable for ETL. Useful only as a human cross-reference.
- **Offenes Parlament (offenesparlament.de, okfde)** = Bundestag-only, and effectively abandoned (old data). Not a Landtag source.
- **okfde/dokukratie + okfde/dokukratie scrapers** = scrapers for German democracy documents (Drucksachen/protocols) per state; document-level, not vote-level. Fallback for motion/protocol text if we ever want it, not for votes.
- **kandidierendencheck / wahl.chat / DeinWal / Wahl-o-Mat** = election-time candidate/position tools (VAA style), not parliamentary vote records. Irrelevant to a votes feed.
- **Per-state open data**: Berlin PARDOK XML (daily, docs+metadata since 1989, no votes), Brandenburg machine-readable XML doc exports, Baden-Wuerttemberg CSV/PDF of namentliche Abstimmungen (2025+), NRW Parlamentsdokumentation (search UI, no API). All are document/protocol layers, not per-member vote feeds, and none beat abgeordnetenwatch for our purpose. There is an inter-parliament "Open-Data-Arbeitsgruppe der Landesparlamente" (led by NRW admin since 2022) but no shared API has shipped.

### 3. Licensing
- **abgeordnetenwatch API: CC0 1.0** (declared in every response `meta.licence`). Public domain, no attribution legally required (courtesy credit is polite). This covers votes, members, parties, mandates. Best possible license.
- **Member photos are the licensing problem.** abgeordnetenwatch serves NO photos in the API. Path: `qid_wikidata` -> Wikidata P18 -> Wikimedia Commons image. Commons images are individually licensed (often CC-BY-SA, sometimes CC0/PD), so each needs per-image attribution captured at ETL time. Official Landtag portrait pages are typically all-rights-reserved and not reusable. This is the same "self-host + credit" pattern the Bundestag app already uses, but per-image credit metadata must be pulled from Commons.
- Per-state portal docs (protocols) carry their own terms; not needed for the pilot.

### 4. Recommendation
**Pilot states: Bayern (primary) + Nordrhein-Westfalen (second).** Bayern has by far the best data (278 total, 64 in the live 2023-28 term, freshest: latest poll 2026-04-28) plus 13.1M people and a culture of frequent namentliche Abstimmungen. NRW adds the largest population (17.9M) with a workable 18 current-term votes. Baden-Wuerttemberg is a strong #3 once its new 2026-31 term accrues votes (92 historical, and it now also publishes official CSVs).

**ETL path: ONE unified abgeordnetenwatch adapter, not per-state scrapers.** New worker `etl/abgeordnetenwatch/` parameterized by `parliamentPeriodId`:
1. members: `candidacies-mandates?parliament_period={id}&type=mandate` -> member rows (name, party, fraction, sex, birth year, education, occupation, wikidata qid).
2. photos: resolve `qid_wikidata` -> Wikidata P18 -> download Commons image + license/author for self-hosting and credit.
3. votes: `polls?field_legislature={id}` then `/polls/{id}?related_data=votes` -> per-member ballots (yes/no/abstain/no_show maps to our ja/nein/enthalten/nicht_abgegeben) + `field_accepted` result + `field_topics` + Drucksache link from `field_intro`.
4. derive party/fraction summaries and hemicycle seat counts from the per-member ballots exactly as the Bundestag pipeline does; run the existing AI title-simplification and summary generators over `field_intro` + Drucksache.
Same Drizzle schema, add a `parliament`/`state` discriminator column. Subdomain-per-state (berlin.machtblick.de) can be one deployed app reading a state param; no code fork per state.

**Leverage (how much of the Bundestag app transfers):**
- Transfers 1:1 (data shape identical): votes feed + vote cards, hemicycle (one dot per seat, absences visible), per-party donut row, member list + member pages (party/fraction/demographics/attendance/loyalty all derivable from ballots), party list + party pages, party colors (map state fractions onto the fixed accent set; a few state-only fractions like Freie Waehler, BVB/Freie Waehler, SSW, BIW need palette entries).
- Needs new/reduced work: NO debate transcripts -> drop the Reden tab entirely (abgeordnetenwatch has no speech texts; per-state protocol XML/PDF parsing would be a large separate project). Motions are thin -> a motion is just `field_intro` + a Drucksache PDF link, no linked full-text corpus or signatory face-pile, so the Motions/Antraege surfaces shrink to a stub or are dropped for v1. Summaries still work (generated in ETL from the intro + Drucksache). Freshness/refresh cron identical.

Realistic scope: a Bayern pilot is mostly a NEW ETL adapter + a schema discriminator + a fraction-color map; the entire read/UI layer (feed, cards, members, parties, hemicycle) is reused, minus Reden and rich Motions.

### 5. Risks
- **Coverage/thin feed (biggest risk):** it is a redaktionelle Auswahl of only the namentliche Abstimmungen; most Landtag votes are Handzeichen with no per-member record anywhere. Expect tens of votes per term, not hundreds. A state like Berlin has just 3 in the current term, Saarland 4 ever. The feed can look empty for low-activity states. Bayern/NRW mitigate this; pick pilots on volume.
- **Freshness lag:** abgeordnetenwatch adds a vote only after the Plenarprotokoll is published and editorial selection, so lag is weeks to months and uneven (NRW latest 2025-12-17, MV 2025-10-10, vs Bayern 2026-04-28 as of 2026-07). Our weekly cron is fine but "latest vote" may be old for quiet states.
- **Photo licensing:** no photos in the API; Wikidata/Commons coverage of Landtag backbenchers is patchy and licenses vary per image, so some members will have no photo and each used photo needs stored attribution. Do not scrape official Landtag portraits (all rights reserved).
- **No debate/motion depth:** dropping Reden and shrinking Motions is a real feature-parity loss vs the Bundestag app; set expectations that a Landtag app is votes+members+parties, not the full transparency stack.
- **New/small fractions and mid-term changes:** state-specific fractions and frequent fraktionslos moves need palette + label handling; mandate changes within a term must be honored per poll date.

## Log
- 2026-07-09 lead: created plan, dispatched research agent.
- 2026-07-10 plumber: pilot ETL shipped as `etl/abgeordnetenwatch/` (Bayern + Berlin into the `mp_*` tables, plan 111). Research findings held up exactly: 64 Bayern polls, Berlin needed the previous term appended (3 current + 9 prior).
- 2026-07-09 research agent: appended findings. Verified abgeordnetenwatch v2 API live (poll counts per state, per-member ballots on Bayern/Berlin polls, CC0 license, member mandates, no photos/speeches). abgeordnetenwatch is the unified source; recommend Bayern + NRW pilot via one ETL adapter; biggest risk is thin roll-call coverage per state.
