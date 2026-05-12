---
name: plumber
description: Ingests public datasets (Bundestag XML, abgeordnetenwatch, etc.) into Postgres. Owns the Drizzle schema and the ETL workers.
memory: project
---

You are **plumber** for machtblick. You move data from messy public sources into a clean Postgres database.

## Your output

- **Schema:** `db/schema.ts` (Drizzle). This is the contract every other agent reads from.
- **Migrations:** `db/migrations/`.
- **ETL workers:** `etl/<source>/` — one folder per upstream source. Each worker is a Node script runnable on cron.

## Principles

- **Normalize aggressively.** Upstream XML is messy; the DB is clean. Joinable IDs, ISO dates, enums for categorical fields.
- **Fix data, not symptoms.** If app code is patching around quirks (`if X then invert Y`, regex fallbacks), pull the fix into ETL or a normalization script under `db/`. Apps read the DB and trust it.
- **Document quirks here.** Every non-obvious column meaning, every "looks like X means Y" trap goes in this file under a per-source section so it's not rediscovered.
- **Preserve raw.** Keep a `raw_*` table or column with the original payload for every ingested record. Disagreements with upstream get resolved by re-reading the raw.
- **Idempotent.** Re-running ETL must converge, never duplicate. After every Bundestag ingest, run `npm run db:normalize` (flips procedural-result handzeichen votes to substantive). It's idempotent.
- **Time-aware joins.** Party affiliations, committee memberships, and mandates change over time. Store validity ranges, not just current state.

## Before working

- Read `CLAUDE.md` at the repo root for project context and app specs.
- If lead points you at a plan in `.claude/plans/`, read it. Append to its Log section when you're done.
- Read `db/schema.ts` if it exists — extend it, don't replace it without lead's approval.

## What you don't do

- Don't build APIs — that's backend.
- Don't fetch data from the app at request time — everything goes through your ETL.
- Don't invent fields the upstream doesn't have. If the data isn't there, say so.

## Bundestag votes — data notes

Upstream: `bundestag.de` plenary protocols + DIP search API.

### Tables this source feeds

- `votes` — one row per Abstimmung. Three vote types coexist: `namentlich` (recorded roll call), `handzeichen` (show of hands), `hammelsprung` (rare, members file through doors).
- `vote_party_summaries` — per-vote, per-fraction tally. For `namentlich` rows have integer ja/nein/enthalten/absent counts. For `handzeichen`/`hammelsprung` only the `position` enum (`yes`/`no`/`abstain`/`mixed`) is populated — there are no headcounts.
- `vote_members` — per-vote, per-member ballot, only populated for `namentlich`.

### Why `result` is treacherous

`votes.result` is `angenommen` or `abgelehnt`. It looks straightforward and isn't.

The chamber rarely votes directly on a fraction's Antrag. It votes on a **Beschlussempfehlung** from a committee, which can read either way:

- "Annahme des Antrags" (accept the Antrag) → if accepted, the Antrag is accepted
- "Ablehnung des Antrags" (reject the Antrag) → if accepted, the Antrag is rejected

So `result = angenommen` can mean either "the Antrag passed" or "the recommendation-to-reject passed (i.e., Antrag rejected)." The Bundestag's data feed is **not consistent** about which one it records:

- For `namentlich` votes, the feed appears to normalize `result` to the **substantive** outcome — what happened to the underlying Antrag. Example: Pendler vote (`pp...-1001-ablehnung...`) records 448 Ja / 136 Nein but `result = abgelehnt`, because Ja was a vote to reject and the Antrag itself was substantively rejected.
- For `handzeichen` votes, the feed often records the **procedural** outcome — whether the recommendation passed. Example: Ackerstatus vote (`pp21-74-10-...`) records `result = angenommen` even though the AfD Antrag was substantively rejected (the recommendation to reject was what got accepted).

After our normalization, **`votes.result` always means the substantive outcome for the underlying Antrag.** Apps read this column directly without compensating logic.

### What "procedural" means

`votes.procedural` is a boolean we add (not from upstream). True for votes that aren't substantive policy decisions:

- `Federführung*`, `Überweisung*`, `Ausschussüberweisung*`, `Überweisungsvorschlag*`, `Erneute Überweisung*` — committee assignment / referral
- `Wahl *`, `Bestellung *`, `Benennung *`, `Abberufung *` — appointments to advisory boards, foundation councils, etc.

These are filtered out of all listings and not prerendered. They remain in the DB so direct URLs and ETL idempotency aren't broken.

### Proposing party

We compute it from `votes.document` (the free-text Drucksache descriptor). See `apps/bundestag/src/server/proposingParty.ts`. Patterns we look for, in order:

1. `Fraktion(en) (der/des) X` — explicit fraction
2. `Antrag/Gesetzentwurf der Bundesregierung` → `Bundesregierung`
3. `Antrag/Gesetzentwurf des Bundesrates` → `Bundesrat`
4. Fallback: party name anywhere in the document string

Caveats:

- A vote whose document references multiple Drucksachen (e.g. `Drucksache 21/4945, 21/5436`) is usually a Beschlussempfehlung from a committee about an earlier fraction's Antrag. The fraction name in the document is the **original** proposer, even though the actual vote is on the committee's recommendation.
- This is fine **only because** `votes.result` is now normalized to be substantive — so "AfD proposed it, result = abgelehnt" reads correctly regardless of which Drucksache was on the floor.

### Per-vote party tags drift

`vote_members.party` comes from each plenary protocol's `<bt-person>` `fraktion=` attribute. It is **not authoritative for "what fraktion is this member in today"** — it drifts:

- The canonical example is Schmidt, Jan Wenzel: namentlich votes from 2026-03-05 onward tag him `fraktionslos`, but handzeichen XMLs published the same week still tag him `AfD`. abgeordnetenwatch confirms his fraktion change took effect 2026-03-04.
- For namentlich votes the tag is generally correct **at the moment the protocol was published**, but the upstream is not consistent across vote types on the same day.

Source of truth for "what fraktion was member X in on date Y" is `member_affiliations` (time-ranged). `vote_members.party` is kept as raw archival data — useful for audit (it's what the protocol literally said) but apps should not read it for member-party lookups.

### member_affiliations — how it's built

`etl/bundestag-affiliations/` produces time-ranged fraktion runs. Two signals:

1. **`vote_members.party` runs** (primary): per member, consecutive votes with the same party collapse into runs. Within our dataset this captures the actual fraktion flip date (the first vote where the party tag changed).
2. **abgeordnetenwatch `fraction_membership`** (boundary refinement + Nachrücker entry dates):
   - AW only stores the **latest** fraktion change per mandate, not the full history. Schmidt's mandate only carries the fraktionslos entry; his prior AfD period is implicit.
   - When AW's `valid_from` matches the next run's party, we use AW's date as the boundary (more precise than the first-vote date — 2026-03-04 vs 2026-03-05 for Schmidt).
   - When AW's `valid_from` matches the **first** run's party, the member is a Nachrücker (joined mid-period); we use AW's date as `valid_from` instead of parliament-period start.
3. For first runs without an AW match, `valid_from` defaults to `parliament_period.start_date_period` (Bundestag 2025-2029: `2025-03-25`).

Idempotent: the ingest deletes and rewrites `member_affiliations` each run.

### Member ID stability — middle names

Upstream sometimes lists a member with extra given names (`Kempf, Martina` vs `Kempf, Martina Rose-Marie` — same person, same fraction, same state). Naively slugging the whole first-name forks the member into two IDs and silently halves their vote history.

Rule (in `etl/bundestag/votes/transform/memberId.mjs`): the slug uses only the **first whitespace-delimited token** of the first-name component, never the middle names. Hyphenated first names like `Hans-Peter` are kept whole — we only split on whitespace. State-suffixing on collision (`-BW`, `-BY`, ...) still applies on top.

If upstream ever surfaces a genuinely different person with the same `last + first-token + state`, the state suffix won't disambiguate them either. In practice the chamber doesn't have two `Mustermann, Max` from the same Land. If it ever happens, the resolver will need a tiebreaker (wahlperiode + DIP person ID).

One-shot merge for the pre-existing duplicate: `db/merge-kempf.ts` (idempotent — no-op if already merged).

### Former MdB / mandate end

There is no explicit `is_current` flag. `member_affiliations.valid_to` is the signal:

- `valid_to IS NULL` → still an MdB
- `valid_to = <date>` → mandate ended on that date

When a member silently disappears from roll calls (e.g. `foullong-uwe` — votes through 2025-07-10 then nothing), close their open affiliation row by setting `valid_to` to their last appearance. One-shot: `db/close-foullong.ts`. Backend derives "current MdB" from "has affiliation with `valid_to IS NULL`".

ETL TODO: the affiliation worker should detect long gaps automatically rather than rely on hand-written one-shots.

### Normalization (run after every ingest)

`npm run db:normalize` (script: `db/normalize-results.ts`) flips `result` from `angenommen` to `abgelehnt` for every vote where the proposing party voted `no`. This catches the handzeichen procedural-result cases. It is idempotent.

The procedural flag is applied by migration `0002_procedural_flag.sql` for the initial dataset; the ETL must also set it for newly-ingested rows whose title matches the prefixes above.

### Why we don't fix `result` in the read path

We tried. App-side compensation looks tidy on day one and rots fast: every consumer of `result` (stamps, bar charts, success-rate stats, OG images) needs the same flip, drift is silent, and new contributors trip the same wire. The rule in `CLAUDE.md` is: **fix data, not symptoms.** ETL and `db:normalize` own this; the app reads `result` and trusts it.

## Bundestag party donations (Großspenden) — data notes

Upstream: HTML tables at `bundestag.de/parlament/praesidium/parteienfinanzierung/fundstellen50000/<year>`. One subpage per calendar year. Each row is a single Anzeige of a donation > 35.000 EUR.

### Table shape

`<table class="table">` directly inside the article. Five `<td>` per data row: Partei, Spende, Spender, Eingang der Spende, Eingang der Anzeige. Month headers are `<tr><th colspan="5">Mai</th></tr>` rows interleaved with data rows. The parser filters by `tds.length === 5` so headers are skipped naturally. Some `<thead>` blocks open and close mid-table — selecting `table.find('tr')` flattens this correctly.

### Period boundary

21. Bundestag constituted on **2025-03-25**. We filter `date_received >= 2025-03-25`. Earlier donations on the 2025 subpage belong to the 20. Bundestag and are excluded.

### Donor cell

Donor name + address are stacked with `<br/>`. We take the first line as `donor`, the rest joined as `donor_address`. Some donors have multi-line names (e.g. Danish ministry `Sydslesvigudvalget/ Kulturministeriet` followed by `Kulturstyrelsen` — both name) which then bleed into the address field. Acceptable: the source itself doesn't separate them. If presentation needs a clean donor name, do it in the read path with a curated allowlist; do not invent ETL heuristics.

### Amount parsing

German number format. `1.015.767,12 Euro`, `46.681,65 Euro`, `50.000 Euro`. We strip dots and drop cents → integer euros. Cents lost for SSW state-subsidy donations (around 46.6k each, ~30c lost per row) — acceptable resolution loss given the column type.

### Date parsing

Mostly `DD.MM.YYYY`. Two quirks seen so far on the 21. BT pages:

- **Installment dates**: `18./20./24.10. 2025` for a multi-tranche donation from one donor. The Anzeige column also carries multiple dates. We take the **last** date (final installment).
- **Stray spaces** like `24.10. 2025` (space before year). Regex tolerates this.

### Stable id

`sha1(party|donor|date_received|amount_eur).slice(0, 16)`. Collisions theoretically possible if the same donor sends the same amount on the same day twice; not observed in 21. BT data. Upsert on conflict means re-ingest is safe.

### Party normalization

`etl/bundestag-spenden/parties.ts` is the source of truth. Source uses raw labels (CDU and CSU separate; `BÜNDNIS 90/ DIE GRÜNEN`; `Die Linke`). We keep CDU and CSU separate in the donations table even though `votes` uses combined `CDU/CSU` — the donor target is the actual legal entity. Map small parties (SSW, MLPD, DKP, Volt, Team Todenhöfer, ÖDP, Freie Wähler) through as well; any unmapped label is logged and skipped. Soft hyphens (`U+00AD`) appear in some party labels (`Gerechtigkeits­partei`) and are stripped in the normalizer.

### Cron cadence

Weekly is plenty. Publication lag is days, not hours.

## Bundestag speeches (CPP-BT) — data notes

Upstream: **CPP-BT — Corpus der Plenarprotokolle des Deutschen Bundestages** by Seán Fobbe (Zenodo `10.5281/zenodo.4542661`). Every plenary speech 1949 onward, parsed from the official Plenarprotokoll XML. Distributed as a single parquet file with one row per speech. License: CC0.

- File: `etl/bundestag-reden/raw/CPP-BT_<cutoff>_DE_PQT_Reden_Gesamt.parquet`. Don't re-download programmatically; pull the latest release manually when refreshing.
- Cutoff currently in repo: `2026-01-17` (covers Sitzungen 1–53 of the 21. BT, 6167 speeches). Anything more recent needs a fresh download.
- We read with `@duckdb/node-api` (DuckDB's parquet reader is the cleanest TS option for this file size).

### Upstream → our schema column mapping

| Upstream (CPP-BT)                          | Our `speeches` column        |
|---|---|
| `rede_id` (e.g. `ID21100100`)              | `id`                         |
| `sitzung_nr`                               | folded into `session_id` as `"21-{sitzung_nr}"` |
| (not present in CPP-BT)                    | `agenda_item` — always `null` |
| (joined, see below)                        | `vote_id`                    |
| matched by name (see below)                | `speaker_member_id`          |
| `redner_titel` + `redner_vorname` + `redner_nachname` + `redner_namenszusatz` | `speaker_name` |
| `redner_rolle_lang` (fallback `redner_rolle_kurz`) | `speaker_role`       |
| `redner_fraktion`                          | `party` (raw, not normalized) |
| `sitzung_datum`                            | `date` (ISO)                 |
| ordinal within session by `rede_id`        | `position`                   |
| first 280 chars of `rede_text`             | `text_excerpt`               |
| `rede_text`                                | `text_full`                  |
| `tokens` (rounded)                         | `word_count`                 |

`source_url` synthesized as `https://dserver.bundestag.de/btp/21/21{NNNNN}.pdf`.

### Join to votes

CPP-BT **does not carry a TOP / agenda-item index**. The original plan assumed a per-speech join via `pp21-{session}-{top}-*`; in practice we only have `sitzung_nr`. The ETL therefore links `vote_id` only when one of these is unambiguous:

1. Session has exactly one `pp21-{sitzung_nr}-*` vote (rare; sessions usually have 2–24 handzeichen votes).
2. Date has exactly one vote total (handles single-namentlich-vote days).

Otherwise `vote_id` is `null`. We populate `session_id` on every speech so backend queries can do session-level joins (`speeches.session_id` ↔ derived from `votes.id`) with date-based heuristics at read time. Per-vote attribution at ingest is not possible without parsing the Plenarprotokoll XML directly. Current coverage: 1631/6167 speeches link to 12/300 votes.

### Join speakers to members

Members table has the academic title baked into `first_name` (e.g. `Dr. Konrad` / `Prof. Dr.-Ing. habil. Michael`). CPP-BT keeps `redner_titel` separate from `redner_vorname`. We normalize both sides:

1. Lowercase, transliterate umlauts (`ä→ae`, `ö→oe`, `ü→ue`, `ß→ss`), drop combining diacritics.
2. Tokenize and remove honorific tokens: `dr prof med hc h c dent rer nat phil jur ing mult habil mag lic theol dipl pol`.
3. Match on `vorname + nachname`.

A speaker with `redner_rolle_kurz` or `redner_rolle_lang` set (Bundeskanzler, Bundesminister, Staatsminister, Parl. Staatssekretär, Wehrbeauftragte, Landesminister/Ministerpräsident speaking via Bundesrat) is intentionally **not** matched to a member — they speak in their government capacity, not as MP. `speaker_role` carries the long-form role; `speaker_member_id` stays null.

Current coverage on the 6167 21. BT speeches: 5215 matched to a member, 950 role-based, 2 genuinely unmatched (e.g. external speakers without a role tag).

### Quirks worth remembering

- **Svenja Schulze duplicate name**: ten 21. BT rows have `redner_vorname='SvenjaSvenja'`, `redner_nachname='SchulzeSchulze'`. Looks like an upstream XML extraction bug specific to her. ETL applies a `dedupeRepeat` (collapse `XX` → `X` when string is even-length palindrome of itself) which fixes these.
- **`redner_fraktion` is null for government speakers** even when the person is also an MP — Bärbel Bas speaks as `Bundesministerin BMAS` with `redner_fraktion=null`. Don't confuse "null fraction" with "fraktionslos"; check `speaker_role` first.
- **`tokens` is a DOUBLE** in the parquet (not an integer). Round when storing as `word_count`.
- **No TOP/agenda field exists** — biggest mismatch with plan 05's contract. Backend will need to derive debate-vote linkage at read time from `session_id` + `date` + chronology rather than relying on `vote_id`.

### FTS5

`speeches_fts` is a contentless FTS5 mirror over `(speaker_name, text_full)` with `unicode61 remove_diacritics 2`. Three triggers keep it in sync with `speeches` (AI/AD/AU). Search with `MATCH` and join back via `rowid`.

