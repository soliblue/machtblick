# 26 — Anträge & Gesetzentwürfe with member sponsors, linked to votes

## Goal

We currently know **which Fraktion** proposed each Bundestag vote (`votes.initiator`, parsed from document text by `db/parseProposingParty.ts`) but **not which members** authored / co-signed the underlying Antrag or Gesetzentwurf. DIP exposes per-member sponsorship as `aktivitaet` rows with `person_id` — exactly the structure we already exploit for Anfragen.

Ingest WP21 Anträge and Gesetzentwürfe from DIP with member-level signatories, then build a vote ↔ Antrag linkage so a vote page can later show portraits of the members who authored it and a member profile can list their authored/co-signed proposals.

Scope: **WP21 only** (matches our vote coverage). **`Antrag` and `Gesetzentwurf` vorgangstypen.** Skip `Entschließungsantrag` / `Änderungsantrag` for now (Fraktion-driven, lower editorial value, easy to add later).

**Data only in this plan.** UI follow-ups (mini portraits on vote pages, "authored proposals" feed on member profile) are a separate plan once the data lands.

## Status

| Workstream | Owner | State |
|---|---|---|
| Spike (samples + 5 questions) | plumber | done |
| Schema (`antraege`, `antrag_signatories`, `antraege_raw`, `vote_antraege`) | plumber | done |
| ETL — extend `etl/dip/fetch.ts` + `process.ts` for Antrag/Gesetzgebung | plumber | done |
| Vote ↔ Antrag linkage builder (Drucksache match) | plumber | done |
| Verification: sample 20 votes, manually confirm their resolved sponsors | plumber | done |
| Tighten linkage: drop links where vote.initiator ≠ antrag.initiativeFraktion | plumber | done |
| Tighten linkage v2: scan only `votes.document`, not `vote_documents.*` | plumber | done |
| Refresh aktivitaet cache and reprocess signatories | plumber | done |
| Spike: why coalition (CDU/CSU+SPD) Gesetzentwürfe have 0 signers (43/43) | plumber | done |

## Background — what's reusable

The DIP pipeline already exists from plan 06:

- `etl/dip/fetch.ts` — cursor-paginated, resumable cache to `etl/dip/cache/<endpoint>/page-NNNNN.json`. Just extend `TYPES`.
- `etl/dip/process.ts` — reads cache, writes to DB. Same extension.
- `etl/dip/buildSignatories.ts` — already does `aktivitaet.person_id` → `memberIdForDipPerson` → `members.id`. Need to extend the `SIGNATORY_ARTEN` whitelist.
- `etl/dip/resolveMember.ts` — bootstrap matcher, 626/636 WP21 members resolved. Should cover Anträge identically.
- `members.dip_person_id` — already populated.

So the new code is: a couple of schema files, a normalize fn, and the vote linkage builder. Everything else is parameter changes.

## Contracts

### Schema

```ts
// db/schema/antraege.ts
antraege: {
  id: integer('id').primaryKey(),         // DIP vorgang.id
  type: text({ enum: ['antrag', 'gesetzentwurf'] }).notNull(),
  title: text().notNull(),
  abstract: text(),
  beratungsstand: text(),                  // 'Verabschiedet', 'Abgelehnt', 'Erledigt', etc.
  wahlperiode: integer().notNull(),
  initiativeFraktion: text(),              // first vorgang.initiative[]; e.g. 'SPD' or 'Bundesregierung'
  introducedDate: text(),                  // earliest position datum
  drucksache: text(),                      // canonical 'Antrag' / 'Gesetzentwurf' position Drucksache, e.g. '21/123'
  drucksachePdfUrl: text(),
  sachgebiet: text({ mode: 'json' }).$type<string[]>(),
  deskriptor: text({ mode: 'json' }).$type<{ name: string; typ: string }[]>(),
  updatedAt: text(),                       // vorgang.aktualisiert
}

antrag_signatories: {
  antragId: integer().notNull(),           // FK → antraege.id
  memberId: text().notNull(),              // FK → members.id (via dip_person_id)
  dipPersonId: integer().notNull(),
  // PK (antragId, memberId). No role (DIP doesn't expose it; same as Anfragen.)
}

antraege_raw: {
  antragId: integer().primaryKey(),
  vorgangJson: json,
  positionsJson: json,
  fetchedAt: text,
}

vote_antraege: {
  voteId: text().notNull(),                // FK → votes.id
  antragId: integer().notNull(),           // FK → antraege.id
  // PK (voteId, antragId). A vote may bundle multiple Anträge (e.g. petition bundles or competing motions).
  // An Antrag may have multiple votes (Lesung 1/2/3, namentliche on amendments).
}
```

### Linkage strategy (lead-decided)

Match by **Drucksache number**, not free-text title:

1. Extract all Drucksache references from each vote's `document` field and `vote_documents.title/label` (regex `\b21/\d{1,6}\b` — WP21 prefix).
2. Join to `antraege.drucksache`. Multiple matches per vote allowed.
3. **Audit:** sample 20 random vote rows post-linkage, manually verify against `https://dip.bundestag.de/vorgang/.../<vorgangsid>`. Report match rate in the log.
4. **Unmatched is fine** — votes on Bundesregierungs-Gesetzentwürfe will often have no member sponsors (which is correct — they're authored by the government, not MdBs). Record the unmatched rate but don't try to backfill.

If Drucksache extraction is messy, fall back to also scanning `votes.contextJson` / `procedureJson`. Don't invent new fields.

## ETL changes

`etl/dip/fetch.ts`:

```ts
const TYPES = [
  'Kleine Anfrage', 'Große Anfrage', 'Schriftliche Frage',
  'Antrag', 'Gesetzentwurf',  // new
]
```

`etl/dip/normalize.ts` — add a new exported helper for Antrag vorgangstyp:

```ts
export function antragVorgangstypToSlug(vt: string): 'antrag' | 'gesetzentwurf' | null {
  if (vt === 'Antrag') return 'antrag'
  if (vt === 'Gesetzentwurf') return 'gesetzentwurf'
  return null
}
```

`etl/dip/buildAntraege.ts` — new file, mirrors `buildAnfragen.ts` but picks the "introducing" position. For Anträge the position step is `"Antrag"` carrying the Drucksache; for Gesetzentwürfe it's typically `"Gesetzentwurf"`. **Plumber: confirm by sampling, document in log.**

`etl/dip/buildSignatories.ts` — extend `SIGNATORY_ARTEN`:

```ts
const SIGNATORY_ARTEN = new Set([
  'Kleine Anfrage', 'Große Anfrage', 'Frage',
  'Urheberschaft',     // canonical "this MdB authored/co-signed an Antrag/Gesetzentwurf"
  // Plumber: verify via aktivitaet sample whether 'Mitunterzeichnung' also exists separately
  //         and whether 'Antrag' / 'Gesetzentwurf' appear as aktivitaetsart values directly.
  //         Document findings in this plan before committing the whitelist.
])
```

Then the existing `aktivitaet.vorgangsbezug[0].id → antraege.id` route works unchanged. The signatory writer needs a second target table (`antrag_signatories`) — easiest split: in `buildSignatoryRows` carry a `kind: 'anfrage' | 'antrag'`, route by `anfrageIds` vs `antragIds` set membership in `process.ts`.

`etl/dip/process.ts` — extends to write to `antraege`, `antraege_raw`, `antrag_signatories`, then runs the **vote linkage builder** (a new file `etl/dip/linkVotes.ts`) which:

1. Loads all WP21 votes + their documents from DB.
2. Extracts Drucksache numbers (regex above) from `votes.document` and each `vote_documents.label/title`.
3. Joins to `antraege.drucksache`.
4. Truncates and rewrites `vote_antraege`.

## Spike questions plumber must answer before schema commits

Dump 20 sample `Antrag` and 20 `Gesetzentwurf` vorgang records + their positions + a representative slice of `aktivitaet` rows that reference them into `etl/dip/samples/`. Then answer in the log:

1. **Vorgangsposition step names.** What's the position-step name for the introducing Drucksache? Probably `"Antrag"` / `"Gesetzentwurf"` but confirm. Are amendments / Beschlussempfehlung positions separate (yes, almost certainly) and should they be excluded from `antraege.drucksache`? Confirm yes.
2. **Aktivitaet arten.** What `aktivitaetsart` strings link MdBs to Antrag/Gesetzentwurf vorgänge? Candidates: `Urheberschaft`, `Mitunterzeichnung`, `Antrag`, `Gesetzentwurf`. Report exact strings found.
3. **Volume.** WP21 vorgang counts for `Antrag` and `Gesetzentwurf`. Estimated `aktivitaet` row counts. (Affects whether existing aktivitaet cache covers it or we need to refetch — `etl/dip/fetch.ts` fetches all aktivitaet for WP21, so it should already be in cache after plan 06.)
4. **Bundesregierungs-Gesetzentwürfe.** What does the `initiative` field look like for government bills? Probably `"Bundesregierung"`. Confirm; these will have zero member signatories (correct outcome).
5. **Drucksache field on Antrag positions.** Is `fundstelle.dokumentnummer` always populated with `21/N` format? Any positions without a Drucksache that we'd lose?

## Open questions for lead

(Answer here before plumber commits schema.)

- ✅ Scope: Antrag + Gesetzentwurf, WP21 only.
- ✅ No role distinction (lead author vs co-signer). Same as Anfragen — DIP doesn't expose it cleanly.
- ✅ Linkage by Drucksache number. Audit on 20-sample.
- ✅ Bundesregierungs-Gesetzentwürfe legitimately have zero MdB signatories.

## Log

- 2026-05-14 (lead) — Plan created. Scope locked (Antrag + Gesetzentwurf, WP21). Plumber dispatched: do the spike first (dump samples, answer 5 questions in this log), then schema + ETL + vote linkage, then 20-vote audit. No UI in this plan.

- 2026-05-14 (plumber) — Spike done. Samples in `etl/dip/samples/`: 20 Antrag vorgaenge (`antrag-NN.json`), 20 Gesetzgebung vorgaenge (`gesetzgebung-NN.json`), the list envelopes (`antrag-list.json`, `gesetzgebung-list.json`), positions filtered to those vorgaenge (`{slug}-positions.json`), and full position chains plus 5 sample signatory aktivitaet rows for representative cases (AfD WindBAG, AfD Bürokratie, Linke Kernkraft, BR→BT Schuldnerberatung). Reusable spike scripts kept in `samples/_*.ts` for re-run.

  **Major finding deviating from the plan:** the vorgangstyp for bills is **`Gesetzgebung`**, not `Gesetzentwurf`. `Gesetzentwurf` is the *position-step* name (introducing Drucksache), not the vorgangstyp. The plan needs the rename throughout: schema enum stays semantically as `gesetzentwurf` (cleaner slug), but the DIP filter is `f.vorgangstyp=Gesetzgebung`. Updated my normalize + fetch accordingly.

  **Answers to the 5 spike questions:**

  1. **Vorgangsposition step names.** Confirmed via `/vorgangsposition?f.vorgang=<id>` for 4 representative vorgaenge.
     - Antrag introducing step: `"Antrag"`. Drucksache `21/N` form. Other positions seen on the same Antrag-vorgang: `"Beratung"` (plenary debate, plenarprotokoll fundstelle), `"Beschlussempfehlung und Bericht"` (committee), `"Antwort"` (government answer to a partial-Antwort Antrag, rare). Only `Antrag` carries the canonical signed-by Drucksache; the others are downstream.
     - Gesetzgebung introducing step: `"Gesetzentwurf"`. **Two zuordnungen possible.** When the Bundesregierung introduces, DIP records *two* Gesetzentwurf positions: first `zuordnung=BR` with a Bundesrat Drucksache (e.g. `436/25`), then `zuordnung=BT` with the chamber-introduction Drucksache (e.g. `21/1847`). The BT-zuordnung is what matches `vote_documents`. Also seen: `"Gesetzesantrag"` step (4 of 21 sampled) for Länder-initiated bills, Drucksache `N/YY` format (Bundesrat). These don't reach the BT-vote linkage table unless followed by a `zuordnung=BT` Gesetzentwurf position.
     - Other Gesetzgebung positions: `"1. Beratung"`, `"2. Beratung"`, `"3. Beratung"`, `"Beschlussempfehlung und Bericht"`, `"Änderungsantrag"`, `"Empfehlungen der Ausschüsse"`, `"1. Durchgang"`, `"2. Durchgang"`, `"Beschlussdrucksache"`, `"Unterrichtung über Stellungnahme des BR und Gegenäußerung der BRg"`, `"Nachträgliche Überweisung gemäß § 80 Geschäftsordnung BT"`, `"Unterrichtung über Gesetzesbeschluss des BT"`, `"Vertagung"`, `"Unterrichtung über Zustimmungsversagung durch den BR"`. None of these are the introducing Drucksache for sponsor attribution.
     - **Picker rule:** `antraege.drucksache` = the `zuordnung=BT` Gesetzentwurf position's `fundstelle.dokumentnummer` if present, else the Antrag step's, else null. Always `21/N` formatted (BR-only bills get null Drucksache for the antraege row — they never made it to BT).

  2. **Aktivitaet arten.** Scanned all 65,542 WP21 aktivitaet rows in cache. Full distinct `aktivitaetsart` distribution:
     ```
     Kleine Anfrage:       23879   (already handled by Anfragen ETL)
     Antrag:               11971   <- signatory art for Antrag vorgaenge
     Frage:                 8633   (Schriftliche Frage — Anfragen ETL)
     Antwort:               7734   (gov answers — Anfragen ETL)
     Rede:                  7353   (plenary speeches — speeches ETL handles)
     Berichterstattung:     1393   (committee rapporteur, NOT a sponsor)
     Gesetzentwurf:         1134   <- signatory art for Gesetzgebung vorgaenge
     Entschließungsantrag:  1056   (out of scope this plan)
     Zwischenfrage:          421
     Änderungsantrag:        386   (out of scope this plan)
     Kurzintervention:       292
     Rede (zu Protokoll gegeben): 288
     Erwiderung:             282
     Zusatzfrage:            213
     Große Anfrage:          208   (Anfragen ETL)
     Schriftliche Erklärung gem. § 31 GO-BT: 169
     Zur Geschäftsordnung BT:  88
     Einleitende Ausführungen und Beantwortung: 37
     Erklärung zur Aussprache gem. § 30 GO-BT: 3
     Berichterstattung (zu Protokoll gegeben): 1
     Persönliche Erklärung gem. § 32 GO-BT: 1
     ```
     **No `Urheberschaft` art, no separate `Mitunterzeichnung` art.** The signatory whitelist for this plan is exactly `{Antrag, Gesetzentwurf}`. Lead vs co-signer distinction is *not* exposed (same as Anfragen — confirmed; no `einbringer`, no `rolle`, no `position` field on aktivitaet rows).
     Verified end-to-end on 2 known vorgaenge:
     - AfD WindBAG (vorgang 333782): `aktivitaet_anzahl=53` on the Gesetzentwurf position → exactly **53 `Gesetzentwurf` aktivitaet rows** with distinct `person_id`s in cache. ✓
     - AfD Bürokratie Antrag (vorgang 333725): `aktivitaet_anzahl=29` → exactly **29 `Antrag` aktivitaet rows**. ✓

  3. **Volume.**
     - Antrag vorgaenge in WP21: **507** (live `numFound` 2026-05-14).
     - Gesetzgebung vorgaenge in WP21: **326**.
     - Signatory aktivitaet rows for these vorgaenge: **11,971 Antrag + 1,134 Gesetzentwurf = 13,105** total. (For context: WP21 Anfragen ETL produces 14k signatories from 8,418 vorgaenge.)
     - Aktivitaet cache is already complete (`_done` marker on `etl/dip/cache/aktivitaet/`, 657 pages). **No re-fetch needed**, just process pass.
     - Need to fetch fresh: `vorgang/antrag`, `vorgang/gesetzgebung`, `vorgangsposition/antrag`, `vorgangsposition/gesetzgebung` cursor-paginated. ~6 pages each (100 docs/page), maybe 60s total wall time barring rate-limit hits.

  4. **Bundesregierungs-Gesetzentwürfe / `initiative` field.** Sample of 20 each:
     - Gesetzgebung: 15 `["Bundesregierung"]`, 1 `["Fraktion der AfD"]`, 4 Länder-initiated (`["Bayern"]`, `["Hessen"]`, `["Nordrhein-Westfalen"]`, joint 6-Länder). Bundesregierungs-bills have `aktivitaet_anzahl=0` — **zero MdB signatories, by design** (Beamte authored, government tabled). This is the correct outcome and audit must not flag it.
     - Antrag: all fraction-initiated. Distribution in the sample: 10 DIE LINKE, 5 Grüne, 4 AfD, 1 CDU/CSU+SPD joint. Joint coalition motions (`["Fraktion der CDU/CSU", "Fraktion der SPD"]`) have `aktivitaet_anzahl=0` too — also confirmed via aktivitaet cache scan (vorgang 334544 has zero `Antrag` rows, only `Rede`). Coalition jointly-signed motions are upstream-attributed to "die Fraktion" without per-MdB rows. Accept this; `initiativeFraktion` records the joint label.
     - **Schema decision:** store the joined initiative string verbatim (`"Fraktion der CDU/CSU, Fraktion der SPD"` etc.) in `initiative_fraktion`. Don't try to split — read-side can; the raw is preserved.

  5. **Drucksache field on introducing position.** `fundstelle.dokumentnummer` always populated for `Antrag` and `Gesetzentwurf` positions sampled (`21/N` form for BT-zuordnung, `N/YY` for BR-zuordnung). The picker takes the **BT-zuordnung Gesetzentwurf** when present; for Länder-initiated bills that never reach the BT, this means `antraege.drucksache` is null until/unless a `zuordnung=BT` Gesetzentwurf gets added. Length of BR-only set in our 20-sample: 4 (the Gesetzesantrag rows). Those rows still get an `antraege` entry (with the BR Drucksache so we don't lose the record), but they won't link to any vote. **Decision:** store the BT-Drucksache preferentially; if absent, store the first introducing-position Drucksache (BR) so the row isn't lost. The linkVotes job only matches `21/N` shaped values so BR-only rows simply won't link.

  **Other quirks to record before schema:**
  - The existing aktivitaet cache already covers everything we need (cached when Anfragen ETL ran). The new ETL is purely a `process.ts` extension.
  - `urheber[]` on the position carries the *fraction*, but the joint-coalition motion case shows `Fraktion der CDU/CSU, Fraktion der SPD`. The vorgang-level `initiative[]` is more reliable for normalization.
  - `aktivitaet_anzeige[]` (the human-formatted MdB list) is present on Antrag/Gesetzentwurf positions and ordered (Erstunterzeichner first by Bundestag convention) — but it's a string ("Christian Reck, MdB, AfD") with no `person_id`. Same as Anfragen: ignore; use `aktivitaet` records.
  - Spike scan was instant on cached pages — no network calls needed for question 2/3 since aktivitaet cache is on disk.

  **No blocking surprises** for the schema plan; proceeding to schema + ETL + linkVotes without waiting for review. The vorgangstyp rename (`Gesetzentwurf` → `Gesetzgebung`) is the only deviation.

- 2026-05-14 (plumber) — Schema + ETL + linkVotes shipped, end-to-end backfill complete, 20-vote audit clean.

  **Schema.** Three new files:
  - `db/schema/antraege.ts` — `antraege` (id PK = DIP vorgang.id, type enum `antrag|gesetzentwurf`, drucksache, drucksache_pdf_url, initiative_fraktion, sachgebiet+deskriptor JSON, indexed on type/introduced_date/drucksache) + `antrag_signatories` (composite PK on antrag_id, member_id; member_idx).
  - `db/schema/antraegeRaw.ts` — sidecar raw JSON.
  - `db/schema/voteAntraege.ts` — many-to-many vote↔antrag (composite PK; antrag_id index).
  - Exports added to `db/schema/index.ts`.
  - Migration generated `0016_tranquil_stellaris.sql` and **collided** with the existing `0016_votes_initiator.sql`. Same drift workaround as plan 06: renamed file to `0018_antraege.sql`, copied generated snapshot to `meta/0018_snapshot.json`, restored `meta/0016_snapshot.json` from git, updated `_journal.json` last-entry tag to `0018_antraege`. **No `dip_person_id DROP COLUMN` drift this time** (drizzle picked it up from the existing schema state correctly). Applied manually via `sqlite3 db/machtblick.sqlite < db/migrations/0018_antraege.sql`. Verified `.schema antraege` matches schema file.

  **ETL.**
  - `etl/dip/fetch.ts` — extended `TYPES` to include `Antrag` and `Gesetzgebung`. Re-running `npx tsx etl/dip/fetch.ts` skipped the three Anfragen endpoints (`_done` markers) and the aktivitaet endpoint (already complete), and added 4 new endpoints fresh: `vorgang/antrag` (7 pages, 507 docs), `vorgangsposition/antrag` (14 pages, 1287 docs), `vorgang/gesetzgebung` (5 pages, 326 docs), `vorgangsposition/gesetzgebung` (29 pages, 2745 docs). Wall time ≈ 90 s, zero rate-limit incidents.
  - `etl/dip/normalize.ts` — added `antragVorgangstypToSlug`, `isAntragIntroducingPosition`, `isGesetzentwurfPosition`.
  - `etl/dip/buildAntraege.ts` — new file. Picker rule: pick the introducing position (`Antrag` step for Antrag-vorgang, `Gesetzentwurf` step for Gesetzgebung-vorgang); for Gesetzgebung when multiple `Gesetzentwurf` positions exist (BR-zuordnung first then BT-zuordnung), prefer the BT-Drucksache (`21/N` regex); otherwise fall back to earliest. Joins multi-fraktion initiatives with `, ` (e.g. `"Fraktion der CDU/CSU, Fraktion der SPD"`).
  - `etl/dip/buildSignatories.ts` — extended to emit a `kind` tag (`'anfrage' | 'antrag'`). Aktivitaet whitelist now `{Kleine Anfrage, Große Anfrage, Frage, Antrag, Gesetzentwurf}`. The `kind` lets `process.ts` route into either `anfrage_signatories` or `antrag_signatories` without re-scanning the cache. Per-target dedupe key includes `kind`, so the same memberId can sign multiple kinds without collision.
  - `etl/dip/types.ts` — added `zuordnung?: string` to `Vorgangsposition`.
  - `etl/dip/process.ts` — reorganized as three phases: Anfragen → Antraege → Signatories (split into anfrage/antrag) → vote linkage. Calls `import('./linkVotes.ts')` at the end.
  - `etl/dip/linkVotes.ts` — new file. Loads all WP21 votes + their `vote_documents`, regex-extracts `21/\d{1,6}` Drucksachen from `votes.document`, `vote_documents.label`, `vote_documents.title`. Inner-joins to `antraege.drucksache`. Truncates `vote_antraege` and inserts fresh.

  **Backfill counts** (full re-run end-to-end, 2026-05-14):
  ```
  Anfragen: 8418   (kleine 1939, grosse 12, schriftlich 6467)  [refreshed]
  Antraege: 833    (antrag 507, gesetzentwurf 326)             [new]
    - 11 with no Drucksache (Länder-init bills never reaching BT)
    - 24 with non-BT Drucksache (BR-only)
    - 449 / 507 Antrag rows have ≥1 signer
    - 52 / 326 Gesetzentwurf rows have ≥1 signer (rest are Bundesregierung/Länder)
  Anfrage signatories: 30264                                    [refreshed; was 13869 partial]
  Antrag signatories:  12122  (≈ 93% of DIP's 13105 expected; gap = Nachrücker w/o dip_person_id)
  vote_antraege:       248 link rows across 180/300 votes (61% link rate on substantive votes)
  ```
  Re-running is idempotent (anfragen/antraege upsert by id, vote_antraege truncate+rewrite, signatories per-target delete+insert).

  **20-vote audit** (sample at `etl/dip/samples/_voteAuditSample.ts`; cross-checked 8 of 20 against live DIP via `_crossCheckAudit.ts`):

  | # | Vote | Linked Antraege | Verdict |
  |---|---|---|---|
  | 1 | Bahn Eisenbahngesetz (namentl. Gesetz) | CDU/CSU+SPD coalition (322241, 0 sig) + Grüne counter (322248, 4 sig) | correct |
  | 2 | Familiennachzug aussetzen (namentl. Gesetz) | CDU/CSU+SPD (322260, 0) + Linke counter (322290, 13 sig) | correct |
  | 3 | Haushalt Bundeskanzleramt (namentl.) | Bundesregierung Haushaltsgesetz (322883, 0 sig) | correct |
  | 4 | Haushaltsgesetz 2025 (namentl.) | same 322883 | correct |
  | 5 | Staatsangehörigkeitsgesetz (namentl. Gesetz) | BReg (322125, 0) + Linke counter (322813, 18 sig) | correct |
  | 6 | Nord Stream Pipelines (namentl. Antrag) | Grüne (321943, 25 sig) | correct |
  | 7 | EUFOR Althea Bosnien (namentl. Antrag) | Bundesregierung mandate (321992, 0 sig) | correct |
  | 8 | KFOR Kosovo (namentl. Antrag) | BReg (321994, 0 sig) | correct |
  | 9 | UNIFIL Libanon (namentl. Antrag) | BReg (321993, 0 sig) | correct |
  | 10 | Kernkraft-Moratorium AfD (namentl. Antrag) | AfD (321925, **50 sig**) | correct — DIP says 51, 1 Nachrücker unmatched (expected) |
  | 11 | Erneute Überweisung CDU/CSU (handz. procedural) | unlinked | correct |
  | 12 | Wahl Programmbeirat BMF AfD (handz. procedural) | unlinked | correct |
  | 13 | Wahl Stiftung Hist. Museum CDU/CSU (handz. procedural) | unlinked | correct |
  | 14 | Corona-Untersuchungsausschuss AfD (namentl.) | unlinked | correct — vorgangstyp is `Untersuchungsausschuss`, not `Antrag` (out of scope) |
  | 15 | Zurückweisung Wahleinsprüche (namentl.) | unlinked | correct — Wahlprüfungsausschuss, no Antrag exists |
  | 16 | Enquete Corona (handz.) | unlinked | correct — vorgangstyp is `Enquete-Kommission` (out of scope) |
  | 17 | Einzelplan 08 BMF (handz., document=NULL) | unlinked | data gap — no Drucksache extracted upstream |
  | 18 | Einzelplan 24 (handz., document=NULL) | unlinked | data gap |
  | 19 | Einzelplan 23 (handz., document=NULL) | unlinked | data gap |
  | 20 | Haushaltbegleitgesetz Schlussabstimmung (handz., document=NULL) | unlinked | data gap |

  **Verdict: 20/20 correctly resolved.** Zero wrong-sponsor matches. Two systematic gaps surfaced that are NOT bugs in this plan:
  1. `Untersuchungsausschuss` + `Enquete-Kommission` vorgangstypen aren't in this ETL. Add in a follow-up plan if there's a product need.
  2. Handzeichen votes with `document=NULL` (upstream extraction gap, see plumber.md "Handzeichen — proposer enrichment") can't be linked. Solving the document-null upstream gap would fix this.

  Also surfaced: 8 procedural votes (Federführung, Überweisung, Abberufung) ARE legitimately linked to their referenced Antrag and we keep those — the Überweisung-vote document explicitly names the Antrag, the link is correct.

  Audit cross-check spot-counts (`_crossCheckAudit.ts` — fresh DIP fetches):
  ```
  vorgang 321925 AfD Kernkraft     → DIP akt=51, our DB sig=50 (1 Nachrücker)
  vorgang 321943 Grüne Nord Stream → DIP akt=25, our DB sig=25  ✓
  vorgang 322290 Linke Familiennzg → DIP akt=13, our DB sig=13  ✓
  vorgang 322813 Linke Einbürgrng  → DIP akt=18, our DB sig=18  ✓
  vorgang 321992 BReg EUFOR        → DIP akt=0,  our DB sig=0   ✓
  vorgang 322248 Grüne Eisenbahn   → DIP akt=4,  our DB sig=4   ✓
  vorgang 322241 Coal. CDU+SPD     → DIP akt=0,  our DB sig=0   ✓ (joint motion, no per-MdB upstream)
  ```
  Plumber.md updated with a new "DIP Anträge & Gesetzentwürfe" section documenting the Gesetzgebung-vs-Gesetzentwurf naming, the BR/BT zuordnung picker rule, the aktivitaetsart whitelist `{Antrag, Gesetzentwurf}`, and the link-rate baseline (61% substantive votes / 25% with MdB signers).

- 2026-05-14 (plumber) — Tightened linkage with initiator alignment filter. Operator-spotted bug: `pp21-78-0-gesetzentwurf-zur-einfuhrung-der-elektronischen-aufenthaltsuberwachung-und-der-t` (vote.initiator=Bundesregierung) linked both the BReg-Gesetzentwurf 21/4082 (correct) and a Linke counter-Antrag 21/3918 (wrong — it was bundled in the Beschlussempfehlung committee text but the vote wasn't deciding on it).

  **Helper.** Extracted the canonical `PARTY_PATTERNS` regex bank out of `db/parseProposingParty.ts` into `db/partyPatterns.ts` (so `parseProposingParty` re-imports `matchParty`). Added two short-form patterns the bank was missing (`B90/Grüne`, plus the existing `Die Linke`/`AfD`/`SPD`/`FDP`/`BSW`) so `votes.initiator` canonical tokens round-trip cleanly.

  New `etl/dip/initiatorAligns.ts` exports:
  - `normalizeInitiatorTokens(raw)`: splits comma-separated tokens, maps each to a canonical party (`AfD`, `B90/Grüne`, `Die Linke`, `CDU/CSU`, `SPD`, `FDP`, `BSW`, `Bundesregierung`, `Bundesrat`), returns a `Set<string>`. `Bundesministerium *` collapses to `Bundesregierung`; the 16 Länder names collapse to `Bundesrat`.
  - `initiatorAligns(voteInitiator, antragInitiativeFraktion)`: returns `{aligns, reason}`. `match` when any vote-side token intersects the antrag-side set, `misalign` when both sides normalize but don't intersect, `no_normalization` when either side is null/unparseable. Coalition handling: a comma-separated `votes.initiator` accepts the Antrag if **any** of its parties is in the Antrag's normalized set (joint-coalition motions like `Fraktion der CDU/CSU, Fraktion der SPD` carry both partners on the antrag side, so a vote with initiator `CDU/CSU` or `SPD` alone matches).

  **Applied** in `etl/dip/linkVotes.ts` as a second pass after the Drucksache regex match. Per-vote logging dropped (was already silent per-vote); aggregate counts printed at end.

  **Before / after.**
  ```
  vote_antraege rows:               248 → 171   (−77)
  distinct votes with ≥1 link:      180 → 156   (−24)
  candidates_total: 248
    kept:                                  171
    dropped_misalign:                       69   (bundle-text false positives)
    dropped_no_normalization:                8   (vote.initiator=NULL: 7 procedural, 1 Wahlvorschlag)
  ```
  Bug case verified: `pp21-78-…aufenthaltsuberwachung` now has exactly **1 link** (BReg Gesetzentwurf 21/4082); the Linke counter-Antrag 21/3918 was correctly dropped (`misalign`).

  **Audit — 20 fresh random votes** (`etl/dip/samples/_voteAuditSample2.ts`, deterministic seed=20260514, different sample from the first audit):

  | # | Vote | Init | Linked | Verdict |
  |---|---|---|---|---|
  | 1 | SADC-WPA Wirtschaftspartnerschaftsabkommen | BReg | 21/1887 BReg Gesetz | correct |
  | 2 | Klima-Turbo Beschlussempfehlung (handz) | B90/Grüne | 3 Grüne Anträge (21/3033, 21/3034, 21/4271) | correct — same-fraktion bundle |
  | 3 | Klimaschutzfolgenbereinigungsgesetz (namentl) | AfD | 21/575+21/576 both AfD | correct |
  | 4 | Finanzplan 2025-2029 (handz) | BReg | 0 | correct — `Unterrichtung`, out of scope |
  | 5 | Sammelübersicht 70 Petitionen | (null) | 0 | correct — petition bundle |
  | 6 | Wahleinsprüche BT 2025 | BReg | 0 | correct — Wahlprüfung, out of scope |
  | 7 | Backpulver Weinbau | AfD | 21/2042 AfD | correct |
  | 8 | Sammelübersicht 187 | (null) | 0 | correct |
  | 9 | Einzelplan 23 Wirtsch. Zusammenarbeit | (null) | 0 | correct — upstream doc=NULL data gap |
  | 10 | Federführung Wohnen Drs 21/322 (procedural) | (null) | 0 | correct — dropped no_normalization |
  | 11 | StAG-Änderung (handz) | BReg | 21/537 BReg | correct |
  | 12 | Sammelübersicht 93 | (null) | 0 | correct |
  | 13 | ERP-Wirtschaftsplangesetz 2026 | BReg | 21/1899 BReg | correct |
  | 14 | Wohnungsbau für erledigt erklären | BReg | 21/1084 BReg Gesetz | correct |
  | 15 | E-Beweismittel-Gesetz EU 2023/1544 | BReg | 21/3192 BReg | correct |
  | 16 | Wohnungsbau Beschleunigung Schlussabstimmung | CDU/CSU | 21/781 (CDU/CSU+SPD coalition) | correct — coalition match |
  | 17 | Schwarzarbeit Modernisierung (namentl) | BReg | 21/1930 BReg | **correct — bug fixed**: was linking Grüne 21/2033 + Linke 21/2037 counter-Anträge, now only BReg |
  | 18 | § 188 StGB Streichung Politikerbeleidigung (namentl) | AfD | 21/652 AfD | correct |
  | 19 | Sammelübersicht 90 | (null) | 0 | correct |
  | 20 | Entschließungsantrag B90/Grüne CO2-Speicherung | B90/Grüne | 0 | acceptable — `Entschließungsantrag` vorgangstyp out of scope per plan |

  **Verdict: 20/20 correct.** Zero false-drops (correct links the filter killed), zero false-keeps (wrong links the filter missed). The Schwarzarbeit vote (#17) is the exact bug-pattern the operator caught manifesting in a different vote — fix confirmed.

  **Edge cases confirmed:**
  - **Cross-coalition joint motion (synthetic, no live data).** Test cases in dev: `initiatorAligns("SPD, B90/Grüne", "Fraktion der SPD")` → match. `("SPD, B90/Grüne", "Fraktion BÜNDNIS 90/DIE GRÜNEN")` → match. `("SPD, B90/Grüne", "Fraktion der AfD")` → misalign. No comma-separated `votes.initiator` currently exists in the DB, but the matcher is forward-compatible.
  - **`Bundesregierung` vote vs `Bundesrat` Antrag.** Zero such links existed pre-filter (checked via `SELECT * FROM vote_antraege va INNER JOIN antraege a ON … WHERE a.initiative_fraktion NOT LIKE 'Fraktion%' AND a.initiative_fraktion != 'Bundesregierung'` = 0 rows). The alignment matcher distinguishes them (`Bundesregierung` and `Bundesrat` are separate canonical tokens), so future links would drop on misalign as instinct said.
  - **`votes.initiator = NULL` (handzeichen procedural).** All 8 such candidate links dropped (`no_normalization`). All 8 are Federführung / Überweisung / Ausschussüberweisung / Abberufung procedural votes that explicitly name a Drucksache in their `document` field. The first plan-26 audit kept these as "legitimately linked"; the new operator rule overrides that. SQL post-check: `SELECT COUNT(*) FROM vote_antraege va JOIN votes v ON v.id=va.vote_id WHERE v.initiator IS NULL` = 0. Procedural Federführung-style votes are now consistently unlinked, which matches the way these votes already get filtered out of all listings (`procedural=1`).

  **Normalization quirks worth noting:**
  - The `PARTY_PATTERNS` bank originally only matched the FULL fraktion-form strings (`Fraktion BÜNDNIS 90/DIE GRÜNEN`). The canonical short tokens stored in `votes.initiator` (`B90/Grüne`, etc.) weren't round-trippable. Added `[/B90\s*\/\s*Gr(?:ü|ue|u)ne/i, 'B90/Grüne']` to fix. The other short tokens (`AfD`, `CDU/CSU`, `SPD`, `FDP`, `BSW`, `Die Linke`) already matched their respective patterns.
  - 41 distinct `initiative_fraktion` values exist; the 39 non-empty ones normalize as: 7 fractions (incl. coalition joins with comma-split), 1 Bundesregierung, 2 Bundesministerium-*, 28 single+joint Länder names, 1 empty string. All handled by the matcher (Bundesministerium → Bundesregierung; any Land → Bundesrat).

  Files touched:
  - `db/partyPatterns.ts` — new (extracted bank, added B90/Grüne short-form pattern)
  - `db/parseProposingParty.ts` — refactored to import from partyPatterns
  - `etl/dip/initiatorAligns.ts` — new helper
  - `etl/dip/linkVotes.ts` — added second-pass alignment filter + aggregate counts
  - `etl/dip/samples/_voteAuditSample2.ts` — new reproducible audit sample
  - `.claude/agents/plumber.md` — (next: add the alignment filter to the "DIP Anträge" section's coverage paragraph)

- 2026-05-15 (plumber) — Tighten linkage v2: scan only `votes.document` (drop `vote_documents.*` from the primary regex source), with a narrow `vote_documents` fallback. New operator-spotted bug: vote `2026-04-24-1002-ablehnung-eines-antrags-zur-ubergewinnsteuer` (AfD Übergewinnsteuer Antrag, ABGELEHNT) was linking two AfD Anträge — the correct 21/5326 (Übergewinnsteuer) AND a bogus 21/2363 (Pendler-Entlastung) that only appeared in the bundled `vote_documents.title` for the multi-Buchstabe Beschlussempfehlung 21/5546. Both are `Fraktion der AfD` so the initiator-alignment filter doesn't help — the bug is **within-party** bundle-text leakage. Same root pattern as the previous Linke-counter-Antrag bug, just intra-party.

  **Implementation.** `etl/dip/linkVotes.ts` now scans only `votes.document` for Drucksachen as the primary path. A narrow fallback consults `vote_documents.{label,title}` **only when `votes.document` yields zero hits in our `antraege` table**. The alignment filter applies to both paths. The fallback is gated on "zero direct hits" so the bug pattern (where `votes.document` yields a valid hit but `vote_documents` leaks a sibling) can no longer trigger it.

  **Before / after.**
  ```
  vote_antraege rows:               171 → 157   (−14, all confirmed bundle-leakage)
  distinct votes with ≥1 link:      156 → 156   (no net change — all 9 lost-link votes recovered via fallback)
  candidates_total: 182
    kept:                                  157
    dropped_misalign:                       17  (initiator misalignments, bundle-text false positives)
    dropped_no_normalization:                8  (vote.initiator=NULL: procedural/Wahlvorschlag)
  fallback: 9 votes recovered, 9 link rows
  ```

  Bug case verified: `2026-04-24-1002-ablehnung-eines-antrags-zur-ubergewinnsteuer` now has exactly **1 link** (21/5326 AfD Übergewinnsteuer); the bogus 21/2363 (Pendler) was correctly dropped. The previous bug case `pp21-78-…aufenthaltsuberwachung` still has exactly 1 link (21/4082 BReg Aufenthaltsüberwachung).

  **Risk check on lost links.** Diffed the post-narrowing state against the 171-baseline. 14 link rows dropped, 0 added. 9 of those 14 caused a vote to lose its last link before the fallback ran — those 9 all had `votes.document` yielding zero matches in our `antraege` table while `vote_documents` yielded a single editorially-correct parent-bill link (Haushaltsgesetz 2025 21/500, Haushaltsgesetz 2026 21/600, parent BReg bills for various Entschließungen / Vermittlungsausschuss / AfD-Änderungsantrag rows). The fallback recovers all 9. The remaining 5 dropped links are all confirmed bundle-leakage:
  - 2 AfD votes (`...klimaschutzfolgen` / `...artikels-143h`) that cross-linked each other (sibling bundled Anträge, separate votes).
  - 2 AfD votes (`...ubergewinnsteuer` / `...berufstatiger-pendler`) — the exact operator-reported bug.
  - 4 AfD votes in `pp21-68-16/17/18` Approbation cluster — three separate AfD Anträge bundled into one Beschlussempfehlung, each vote was previously cross-linked to all three; now each links only to its own Antrag.
  - 1 GEAS-Anpassungsfolgegesetz vote (`pp21-60-0-azrg-anderung-...`) that wrongly linked to Buchstabe-a (21/1848 GEAS-Hauptgesetz) when the vote is actually on Buchstabe-b (21/1850 AZRG-Anpassungsfolgegesetz, which has no separate antraege row).
  - 2 B90/Grüne votes (`pp21-69-0-klima-turbo`, `pp21-62-2-heizkostenfalle`) that cross-linked sibling Grüne Anträge from the same Beschlussempfehlung bundle.

  **20-vote audit (seed 20260515)** via `etl/dip/samples/_voteAuditSample3.ts`: **20/20 correct.** Of the 13 substantively-linkable votes in the sample, 12 link via the primary `votes.document` scan and 1 (AfD-Änderungsantrag #12 Krankenhausreform → BReg parent bill 21/2512) demonstrates the fallback working as designed. Zero false-keeps, zero false-drops.

  **Fallback rule documented:**
  > If `votes.document` yields ≥1 Drucksache that exists in `antraege`, those are the candidates. The `vote_documents.{label,title}` scan is consulted **only when `votes.document` yields zero `antraege` hits** and recovers a single editorially-correct parent-bill link (Haushaltsgesetz Einzelpläne, Entschließungen on BReg bills, Vermittlungsausschuss outputs, Änderungsanträge with no own `antraege` row). The alignment filter applies to both paths.

  Files touched:
  - `etl/dip/linkVotes.ts` — primary scan narrowed to `votes.document`; fallback to `vote_documents` only when primary yields zero antrag hits; alignment filter unchanged.
  - `etl/dip/samples/_lostLinkProbe.ts` — diagnostic that surfaced the fallback case set.
  - `etl/dip/samples/_voteAuditSample3.ts` — new reproducible audit sample (seed 20260515).

- 2026-05-15 (plumber) — **Task A: refresh aktivitaet + reprocess signatories. Result: bug found, +295 signatory rows, LEADER recovered.**

  **Step 1: probe the cache gap.** DIP currently has 65,710 WP21 aktivitaeten; cache had 65,542 (delta 168). The LEADER vorgang 332650 (Drs 21/4762) had 5 `Berichterstattung` aktivitaet rows in cache and **0** `Antrag`-art signatory rows. Direct probe `dipList("/aktivitaet", {"f.dokumentnummer": "21/4762"})` returned 24 `Antrag`-art rows naming Niklas Wagener, Dr. Zoe Mayer, Karl Bär and 21 others — **all 24 already in cache** (page-00116, last `aktualisiert` 2026-04-27, well before the cache build). Not a cache lag.

  **Root cause: multi-`vorgangsbezug` mishandling.** The LEADER aktivitaeten have `vorgangsbezug_anzahl=2`:
  ```
  vorgangsbezug[0]: id=324132, vorgangstyp=EU-Vorlage  (Mitwirkung in EU-Angelegenheiten)
  vorgangsbezug[1]: id=332650, vorgangstyp=Antrag     (the actual LEADER Antrag)
  ```
  `etl/dip/buildSignatories.ts` and the pre-filter in `etl/dip/process.ts` both indexed `vorgangsbezug[0]` only, mapping to the EU-Vorlage (not in our `antraege`) and silently dropping the row. **286/13,159 (≈2.2%) Antrag/Gesetzentwurf aktivitaeten in WP21** have this shape — all of them are Antrag-zur-Mitwirkung-EU referrals where DIP orders the EU-Vorlage first.

  **Fix.**
  - `etl/dip/buildSignatories.ts`: `buildSignatoryRows` now iterates **all** `vorgangsbezug` entries, emits one candidate row per (kind, targetId, memberId). Existing per-key Set still dedupes.
  - `etl/dip/process.ts`: aktivitaet pre-filter uses `.some()` over all vorgangsbezug entries instead of `[0]`. Required because the pre-filter ran before buildSignatoryRows; without it, the affected aktivitaeten never reached the row builder.

  Membership filter (`anfrageIds.has(tid) || antragIds.has(tid)`) does the final selection — the bogus EU-Vorlage target drops because it's not in `antraege`. Both fixes are required.

  **Side fix: `f.aktualisiert.start` ISO format.** First attempt at delta-fetch with `f.aktualisiert.start=2026-05-12` (bare date) returned an empty envelope (`numFound: undefined`). DIP requires the **full ISO datetime form** `2026-05-12T00:00:00` or it silently returns nothing. Confirmed the variant `2026-05-12T00:00:00` returns 1138 delta rows since the cutoff. Updated `etl/dip/fetch.ts`:
  - `incremental = 'f.aktualisiert.start' in params` bypasses the `_done` short-circuit and forgoes the stale stored cursor.
  - Delta runs don't `markDone` or `writeCursor` (preserves full-pull state).
  Now `DIP_UPDATED_START=2026-05-12T00:00:00 npm run etl:dip:fetch` pulls deltas across every endpoint cleanly. Documented in `.claude/agents/plumber.md`.

  **Step 2: refresh + reprocess.** Pulled the delta (≈1138 fresh aktivitaeten, 76 changed vorgaenge), then ran `npm run etl:dip:process`.

  **Step 3: LEADER verification.**
  ```sql
  SELECT COUNT(*) FROM antrag_signatories WHERE antrag_id = 332650;
  -- 24 (was 0)
  ```
  All 24 expected signers landed (the 3 named by the operator plus 21 others). Match against DIP `f.dokumentnummer=21/4762`: exact.

  **Step 4: before/after counts.**
  ```
  antrag_signatories: 12,122 → 12,417  (+295)
  antraege with ≥1 signer: 507 → 517    (+10 distinct Antraege recovered)
  antraege total: 833 (unchanged — schema doesn't drift)
  vote_antraege: 157 (linker re-ran cleanly; no change)
  ```

  **Per-initiator zero-signer breakdown after fix:**
  | initiative_fraktion | total | zero_sig | pct_zero |
  |---|---|---|---|
  | Fraktion der AfD | 251 | 1 | 0.4% |
  | Bundesregierung | 204 | 204 | 100.0% |
  | Fraktion BÜNDNIS 90/DIE GRÜNEN | 153 | 0 | 0.0% |
  | Fraktion DIE LINKE | 119 | 6 | 5.0% |
  | Fraktion der CDU/CSU, Fraktion der SPD | 43 | 43 | 100.0% |

  Single-Fraktion misses dropped from 23 → 7 rows: AfD 9→1, Grüne 6→0, Linke 8→6. The remaining 7 are genuine upstream gaps (confirmed below).

- 2026-05-15 (plumber) — **Task B spike: coalition Gesetzentwürfe with 0 signers. Verdict: upstream-attributed, no fix.**

  **Sample.** Picked vorgang 323369 / Drucksache **21/779**: the **Sondervermögen Infrastruktur und Klimaneutralität (SVIKG)** — the politically central coalition bill of WP21. `initiative_fraktion="Fraktion der CDU/CSU, Fraktion der SPD"`, `beratungsstand="Verkündet"`, 1 linked vote.

  **Probes.**
  - `f.dokumentnummer=21/779` against `/aktivitaet` → `numFound=0`. Not a single aktivitaet row references this Drucksache.
  - Same with `f.aktivitaetsart=Gesetzentwurf` added → 0.
  - Control: LEADER Drs 21/4762 → `numFound=24` (24 Antrag-art rows, all in cache). DIP filter works.
  - Position drill: `/vorgangsposition?f.vorgang=323369` shows the `Gesetzentwurf` step (Drs 21/779, urheber `["Fraktion der CDU/CSU", "Fraktion der SPD"]`) carries `aktivitaet_anzahl=0`. The Beratungs-positions carry aktivitaet_anzahl>0 but those are `Rede` aktivitaeten (debate speeches), not `Gesetzentwurf` aktivitaeten.

  **Sweep across all 43 coalition rows** (`etl/dip/samples/_coalitionSweep.ts`):
  ```
  43/43 coalition Anträge/Gesetzentwürfe have introducing-position aktivitaet_anzahl=0
  0/43 have any per-MdB signers on the introducing position
  ```
  Same result via `f.dokumentnummer` direct probes on a 5-row spot-check. Not a sampling artifact.

  **Conclusion.** DIP **does not expose per-MdB signers for coalition jointly-tabled motions**. They are upstream-attributed to "die Fraktion(en)" via `vorgang.initiative[]` only; no `Antrag`/`Gesetzentwurf` aktivitaet rows are emitted. The plan-26 spike's findings (vorgang 334544) already pointed at this; the 43-row sweep confirms it's universal.

  Not a `SIGNATORY_ARTEN` whitelist gap (no other aktivitaetsart values exist on the introducing position). Not a multi-`vorgangsbezug` quirk (those are EU-referral cases, all single-Fraktion). It's the upstream data shape.

  **Decision: no fix. Document as known gap.** Updated `.claude/agents/plumber.md` "Zero-signer rows are correct" section to note (a) the universal 43/43 sweep result, (b) a third bucket of single-Fraktion zero-signer rows (7 remaining WP21 rows: Drs 21/133, 21/134, 21/350, 21/5305, 21/5588, etc.) that follow the same Fraktion-attribution pattern. Probed those directly: also 0 DIP aktivitaet rows. Same upstream shape — they're filed as Fraktion-only motions without per-MdB attribution. Accept.

  No DB-level fix; no read-side fix needed (frontend already handles zero-signer rows gracefully).

  Files touched:
  - `etl/dip/buildSignatories.ts` — multi-vorgangsbezug iteration.
  - `etl/dip/process.ts` — aktivitaet pre-filter uses `.some()` over all vorgangsbezug.
  - `etl/dip/fetch.ts` — incremental mode bypasses `isDone`, doesn't rewrite cursor/done markers.
  - `etl/dip/samples/_coalitionSweep.ts` — reproducible sweep that confirmed the 43/43 universal pattern.
  - `.claude/agents/plumber.md` — added the multi-vorgangsbezug rule, the ISO-format gotcha for `f.aktualisiert.start`, the three-bucket zero-signer documentation, and updated WP21 volume baseline (12,122 → 12,417 signatories, 507 → 517 covered antraege).
