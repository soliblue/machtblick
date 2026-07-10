# 110: European Parliament support (eu.machtblick.de)

## Goal
Extend machtblick to the European Parliament: roll-call votes, MEPs, political groups, ideally with the German lens (how German parties/MEPs vote in Brussels) since our audience is the German public. Same card language, hemicycle, cohesion stats; conversation view later if debate data allows.

## Status
- research: in progress (agent)
- architecture: todo
- pilot: todo

## Open questions
- Best source: official open data portal vs HowTheyVote.eu vs Parltrack (coverage, freshness, licensing)?
- German MEP <-> party mapping quality (CDU/CSU->EVP etc)?
- Debate/speech data feasibility (CRE multilingual)?
- eu.machtblick.de as separate app vs integrated?

## Research findings (agent appends here)

### TL;DR
Feasibility is high. Two complementary, clean sources exist: the **official EP Open Data API** (JSON-LD, per-MEP roll-call ballots, MEP national-party + group history, multilingual titles incl. German, MEP photos) and **HowTheyVote.eu** (weekly CSV dumps + experimental API, per-MEP ballots pre-joined, fresh within ~30 min). An MVP (votes feed + MEP pages + group pages + hemicycle, German-lens filter) reuses the Bundestag app's structure almost 1:1. Biggest risk is the **German debate/conversation view**: EP no longer translates verbatim speeches into all languages, so a German WhatsApp-style debate needs machine/LLM translation of non-German speeches.

### 1. Official EP Open Data Portal (data.europarl.europa.eu)
Live since Jan 2023. REST API base `https://data.europarl.europa.eu/api/v2/`, content negotiation via `Accept` header. Confirmed working via direct curl (portal HTML is JS-rendered and returns empty to WebFetch, but the API returns clean JSON-LD).

- **Serializations:** JSON-LD (`application/ld+json`), RDF/Turtle, RDF/XML; some datasets also CSV. Multilingual RDF using EU controlled vocabularies (24 languages). EPVOC / ELI-DL / ORG-EP ontologies.
- **Roll-call votes = full per-MEP ballots (verified):**
  - `GET /meetings/{MTG-PL-YYYY-MM-DD}/vote-results` lists vote items (multilingual `activity_label` including **de**, links to procedure docs `A-...`, minutes `PV-...`, and RCV request activities tagged with the requesting group e.g. `ESN`).
  - `GET /meetings/{mtg}/decisions/{DEC-id}` returns the decision with arrays `had_voter_favor`, `had_voter_against`, `had_voter_abstention` (each a list of `person/{id}`), plus `had_voter_intended_*` (post-vote corrections), and aggregate `number_of_votes_favor/against/abstention`, `number_of_attendees`. Example verified: `MTG-PL-2025-12-16 / DEC-182608` -> 122 for / 470 against / 69 abstention / 661 attendees, one intended-against correction.
  - Granularity: one decision per RCV, per-MEP position resolvable to person -> membership -> national party + EU group at vote date.
- **Meetings/sessions:** `GET /meetings` goes back to **2014-01-13** (term 8). So official per-MEP RCV coverage spans terms 8, 9, 10.
- **MEPs:** `GET /meps?parliamentary-term=10[&country=DEU]`, `GET /meps/{id}`. Each MEP has `hasMembership[]` entries with `membershipClassification` = `NATIONAL_POLITICAL_GROUP` or `EU_POLITICAL_GROUP`, each pointing to an `org/{id}` with a `memberDuring` start/end. So **national party and EU group are both time-scoped and historically complete** (verified on Ferber: term-10 national party `org/6776` = CSU, EU group `org/7018` = EPP; full history back to 1994).
- **Org resolution:** `GET /corporate-bodies/{id}` -> label + multilingual altLabel + `represents` (country). National parties, national delegations, and EU groups are all corporate bodies.
- **Photos:** `https://www.europarl.europa.eu/mepphoto/{mepId}.jpg` -> HTTP 200 `image/jpeg` (verified, ~118 KB). Standard EP portrait, official source.
- **Adopted texts / procedure titles:** vote items carry `based_on_a_realization_of` (report doc, e.g. `A-10-2025-0249`) and multilingual `structuredLabel`; adopted texts (`TA-...`) and Legislative Observatory procedures are separate datasets on the portal. Multilingual titles mean **official German titles are already available** (no translation needed for vote titles).
- **Freshness:** portal publishes after the verbatim/minutes service processes; not real-time but same/next-day. HowTheyVote is faster for immediate freshness.
- **OpenAPI:** portal has a "Developers' corner" with an OpenAPI/Swagger for the API (`/en/developer-corner/opendata-api`); page is JS-rendered so not captured here, but the v2 REST surface is stable and content-negotiated as shown.
- **License:** EP data reusable under the EP legal notice (reuse permitted with source acknowledgement, aligned with Decision 2011/833/EU); no per-record licensing blockers for votes/MEPs/titles. Photos are EP copyright but published for reuse with attribution.

### 2. HowTheyVote.eu
Independent open-source project (`github.com/HowTheyVote`). Compiles official sources (plenary RCV minutes, Legislative Observatory, press releases).

- **Coverage:** EP term **9 onward** (2019-). 24,844 votes / 1,278 MEPs as of their About page. Earlier data (2004-2022) only via the archived VoteWatch dataset they host.
- **Freshness:** vote results appear **within ~30 minutes** of EP publication. Bulk data repo (`HowTheyVote/data`) refreshed weekly; verified `last_updated = 2026-07-04`.
- **Bulk CSV dumps** (`github.com/HowTheyVote/data/releases/latest/download/{name}.csv.gz`, stable URLs). Verified schemas:
  - `votes`: `id, timestamp, display_title, reference, description, amendment_subject, amendment_number, is_main, procedure_reference, procedure_title, procedure_type, procedure_stage, count_for, count_against, count_abstention, count_did_not_vote, result, texts_adopted_reference`
  - `member_votes`: `vote_id, member_id, position, country_code, group_code` — **position = FOR / AGAINST / ABSTENTION / DID_NOT_VOTE**, with the MEP's group at vote time. This is the per-MEP ballot, pre-joined and ready for a hemicycle.
  - `members`: `id, first_name, last_name, country_code, date_of_birth, email, facebook, twitter` — **note: no national party column and no photo URL** (gap; fill from official API + mepphoto URL).
  - `groups`: `code, official_label, label, short_label` (EU groups only).
  - `group_memberships`: `member_id, group_code, term, start_date, end_date`.
  - `committees`, `geo_areas`, `oeil_subjects`, `eurovoc_concepts` (topic tagging). `country_memberships`, `responses` were empty in the current dump.
- **API:** experimental REST API + per-vote JSON/CSV download links on each vote page. Marked unstable.
- **Stack (their app `HowTheyVote/howtheyvote`):** Python backend (Poetry, a `htv` CLI running pipelines: `htv pipeline members/sessions/rcv-list --term=10 ...`), TypeScript frontend, Postgres in Docker Compose, Caddy proxy, background worker. **License: AGPL-3.0** (copyleft — reusing their *code* would impose AGPL; reusing their *data* does not).
- **Data license:** votes/members/groups under **ODbL (Open Database License)**. Explicitly **excluded:** MEP **photos** and **vote summaries** are not covered (they come from EP under EP copyright).

### 3. Other aggregators
- **VoteWatch Europe: dead** (ceased operations 2022). Its historical dataset (EP6-EP9 partial, 2004-2022) survives, rehosted by HowTheyVote for pre-2019 coverage.
- **Parltrack (parltrack.org): alive.** Scrapes OEIL, plenary minutes, MEP profiles, committee agendas. Bulk JSON dumps + lightweight API, dossiers + votes + reps. License: Open Database License / Database Contents License; photos + vote summaries excluded (same EP-copyright carve-out). Useful as a cross-check / dossier-linkage source, not needed as primary.
- **itsyourparliament.eu, TrackMyEU, MEP Watch, academic sets (Simon Hix, CLARIN, DW/`dw-data`):** niche or stale; not needed given the two primary sources.

### 4. Debate / speech data (biggest feasibility question)
- **CRE (Compte Rendu in Extenso, verbatim report):** published per sitting under Rule 204, at `https://www.europarl.europa.eu/doceo/document/CRE-10-YYYY-MM-DD_{LANG}.html`. Each speech appears **in its original language only** within a multilingual document. (Direct fetch returns HTTP 202 async-render; content is real, just JS/stream-gated.)
- **Translation reality:** the EP **no longer produces full translated verbatim reports into all 24 languages** (discontinued for cost). So a German speech is German, a Polish speech is Polish, etc. There is **no systematic official German text** for non-German speeches. Live **interpretation** (audio) exists in all languages and video is on the Multimedia Centre / EP Live, but that is audio/video, not machine-readable German text.
- **Implication for our WhatsApp debate view:** feasible structurally (speaker + speech + timestamp are parseable from CRE, and speakers map to MEP ids), but a **German-language** conversation requires **machine/LLM translation** of every non-German turn. This fits our "LLM enrichment via local agent CLI" pattern (`codex exec` / `claude -p`) but is a real volume + quality + consistency cost, and translated speech must be labelled as machine-translated. Recommend deferring debates past MVP.
- **Alt corpora:** DCEP (JRC Digital Corpus of the European Parliament) and Europarl parallel corpus exist for older material but are research corpora, not live.

### 5. German lens
- **Isolation is trivial:** MEP records carry ISO country (`DEU` / `country_code=DEU`); Germany = **96 MEPs** (largest delegation). Filter votes and members by country in one field.
- **National party quality: excellent.** Official API distinguishes each national party as its own corporate body with time-scoped membership, so **CDU vs CSU are separable** (CSU = `org/6776`), as are SPD, Grüne, AfD, Die Linke, FDP, Freie Wähler, Volt, BSW, Die PARTEI, ödp, etc. HowTheyVote's CSV lacks national party, so **join national party from the official API** (or Parltrack).
- **2024-2029 group landscape (720 seats):** EPP 188, S&D 136, PfE (Patriots for Europe, ex-ID) 84, ECR 78, Renew 77, Greens/EFA 53, The Left (GUE/NGL) 46, ESN (Europe of Sovereign Nations, new far-right) 25, non-attached remainder.
- **German party -> EP group (term 10):** CDU + CSU -> EPP; SPD -> S&D; Grüne + Volt -> Greens/EFA; FDP + Freie Wähler -> Renew; Die Linke -> The Left; **AfD -> ESN** (AfD is the core of the new Europe of Sovereign Nations group after being expelled from ID); **BSW -> non-attached**; Die PARTEI -> non-attached. German seat split (2024): CDU/CSU ~30, AfD 16, SPD 14, Grüne 12, BSW 6, FDP 5, Freie Wähler 3, Die Linke 3, Volt 3, Die PARTEI 2.
- **German-lens views that light up:** "how the German delegation split on vote X" (hemicycle of 96), per-German-party cohesion, "which German MEPs broke with their EU group", national-party-colored breakdowns using our existing party-color mapping.

### 6. Recommendation
**Source stack:** primary = **official EP Open Data API** for MEPs, national party, EU groups, org labels, multilingual (German) vote titles, adopted-text linkage, and photos; primary = **HowTheyVote.eu weekly CSV dumps** for the per-MEP ballot matrix (pre-joined, fresh, easy to load). Use HowTheyVote for the vote list + ballots, backfill national party + photos from the official API keyed by the shared numeric MEP `person id` (both use the same EP identifiers — verified: Goerens=840, Ferber=1917 in both). Parltrack only as an optional dossier/cross-check source. Do **not** fork HowTheyVote's AGPL app; consume its ODbL data.

**MVP shape:** a new self-contained `apps/europarl` (deployed at eu.machtblick.de), sharing the root design tokens and `packages/ui`. Three feeds mirroring Bundestag:
1. **Votes feed** — same card language, hemicycle of 720 seats, per-EU-group donut row, official German title, LLM-simplified German summary of the procedure. German-lens toggle re-scopes the hemicycle to the 96 German seats and the donut row to German parties.
2. **MEP pages** — photo (mepphoto URL), national party + EU group, voting record, cohesion vs group.
3. **Group pages** — the 8 EU groups + non-attached, hemicycle, member list, German sub-delegation highlighted.
Plus a German-delegation filter across everything. Debates deferred.

**Transfers ~1:1 from Bundestag app:** card/verdict language, hemicycle component (bigger seat count, same concept), per-party donut row, party-color mapping (extend to EU groups + German parties), TanStack Router/Query/loader architecture, prerender discipline, ETL "Node worker per source" shape, LLM title/summary simplification via local agent CLI, the WhatsApp debate view component (reusable once/if speech text exists).

**New work:** two ETL workers (official EP API JSON-LD ingest; HowTheyVote CSV ingest) + a join/normalization step keyed on MEP id; schema for MEP/national-party/EU-group with time-scoped memberships (more temporal than Bundestag); EU-group + German-party color tokens; German summary generation from procedure titles/adopted texts; 720-seat hemicycle layout.

**Biggest risks (ranked):**
1. **German debate view** — no official German text for non-German speeches; needs LLM translation at volume, label as machine-translated. Defer.
2. **German summaries** — vote/procedure titles are official multilingual (German exists), but rich *summaries* must be LLM-generated from EN/DE source; manageable with local agent CLIs, same pattern as Bundestag.
3. **Photo rights** — EP photos are EP copyright, reuse-with-attribution; fine but must attribute and not relicense (HowTheyVote/Parltrack both exclude them for this reason).
4. **National-party join** — HowTheyVote lacks it; must pull from official API. Low risk (same MEP ids, verified).
5. **Data-license hygiene** — HowTheyVote data is ODbL (share-alike on the DB), official EP data is EP-legal-notice reuse; keep provenance/attribution per source. Avoid pulling HowTheyVote's AGPL *code*.

### Sources
- EP Open Data Portal: https://data.europarl.europa.eu/ ; Developers' corner: https://data.europarl.europa.eu/en/developer-corner/opendata-api ; Datasets: https://data.europarl.europa.eu/en/datasets ; beta-testing spec: https://github.com/europarl/open-data-beta-testing
- EP API (verified via curl): `/api/v2/meps`, `/api/v2/meps/{id}`, `/api/v2/corporate-bodies/{id}`, `/api/v2/meetings`, `/api/v2/meetings/{mtg}/vote-results`, `/api/v2/meetings/{mtg}/decisions/{DEC}`
- MEP photos: https://www.europarl.europa.eu/mepphoto/{id}.jpg
- HowTheyVote data repo: https://github.com/HowTheyVote/data ; app repo: https://github.com/HowTheyVote/howtheyvote ; about: https://howtheyvote.eu/about ; developers: https://howtheyvote.eu/developers
- Parltrack: https://parltrack.org/ ; https://data.europa.eu/en/publications/use-cases/parltrack
- CRE verbatim: https://www.europarl.europa.eu/doceo/document/CRE-10-2026-03-25_EN.html ; Rule 204: https://www.europarl.europa.eu/doceo/document/RULES-9-2023-07-10-RULE-204_EN.html ; Debates/video: https://www.europarl.europa.eu/plenary/en/debates-video.html
- 2024 results: https://results.elections.europa.eu/en/seats-political-group-country/2024-2029/ ; https://en.wikipedia.org/wiki/2024_European_Parliament_election ; Germany: https://en.wikipedia.org/wiki/2024_European_Parliament_election_in_Germany ; https://results.elections.europa.eu/en/national-results/germany/2024-2029/
- EP legal notice (reuse): https://www.europarl.europa.eu/legal-notice/en/

## Log
- 2026-07-09 lead: created plan, dispatched research agent.
- 2026-07-09 research: appended findings. Verified EP Open Data API returns full per-MEP roll-call ballots (had_voter_favor/against/abstention) + national-party/EU-group membership history + working MEP photos; HowTheyVote CSV dumps carry per-MEP ballots but no national party/photo (join from official API on shared MEP id). Recommend official API + HowTheyVote as dual source stack; MVP = votes/MEP/group feeds reusing Bundestag card+hemicycle with a 96-MEP German lens; debates deferred (no official German text for non-German speeches).
