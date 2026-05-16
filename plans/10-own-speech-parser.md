# 10 — Native Bundestag protocol XML parser

## Goal

Replace dependence on Fobbe's CPP-BT parquet with our own TypeScript parser that reads Bundestag plenary protocol XML directly. Two payoffs:

1. **Live coverage.** CPP-BT lags by months (current parquet stops at 2026-01-17, sitting 53). We need sessions 54+ now and want a daily cron.
2. **TOP attribution.** CPP-BT drops the `<tagesordnungspunkt>` wrapper, so only 12/300 of 21. BT votes have any speeches linked. The XML carries it, so our parser keeps it and we backfill the 1631→6167 join properly.

## Source

- **URL pattern:** `https://dserver.bundestag.de/btp/21/21{NNN}.xml` where `NNN` is the 3-digit sitting number (e.g. `21054.xml`). Verified working.
- **Latest session today (2026-05-12):** 78. CPP-BT covers 1–53. Gap = 25 sessions.
- **License:** Bundestag Open Data, free for any use.
- **No index needed.** Probe sequentially until 404.

## Reference: Fobbe's parser

MIT-0, R, at codeberg.org/seanfobbe/cpp-bt. Source script also on Zenodo (DOI 10.5281/zenodo.4542661). Read for edge cases (name normalization, role mapping) but reimplement in TS — we want native, typed, and we're fixing the TOP gap his pipeline drops.

## XML structure (sample: `etl/bundestag-reden/raw/xml/21054.xml`)

```xml
<dbtplenarprotokoll>
  <kopfdaten>
    <plenarprotokoll-nummer><wahlperiode>21</wahlperiode><sitzungsnr>54</sitzungsnr></plenarprotokoll-nummer>
    <veranstaltungsdaten><datum date="DD.MM.YYYY"/>...</veranstaltungsdaten>
  </kopfdaten>
  <sitzungsverlauf>
    <sitzungsbeginn>...</sitzungsbeginn>
    <tagesordnungspunkt top-id="Tagesordnungspunkt 25">
      <p klasse="J">...intro text from the Präsident...</p>
      <rede id="ID215400100">
        <p klasse="redner">
          <redner id="999990153">
            <name>
              <titel>Dr.</titel>
              <vorname>Karsten</vorname>
              <nachname>Wildberger</nachname>
              <rolle>
                <rolle_lang>Bundesminister für Digitales und Staatsmodernisierung</rolle_lang>
                <rolle_kurz>Bundesminister BMDS</rolle_kurz>
              </rolle>
            </name>
          </redner>
          Dr. Karsten Wildberger, Bundesminister für Digitales und Staatsmodernisierung:
        </p>
        <p klasse="J_1">...speech body paragraph...</p>
        <kommentar>(Beifall bei der CDU/CSU ...)</kommentar>
        <p klasse="J">...</p>
        ...
      </rede>
      <rede id="ID215400200">
        <p klasse="redner"><redner id="11005100"><name><titel>Dr.</titel><vorname>Michael</vorname><nachname>Kaufmann</nachname><fraktion>AfD</fraktion></name></redner>Dr. Michael Kaufmann (AfD):</p>
        ...
      </rede>
    </tagesordnungspunkt>
  </sitzungsverlauf>
</dbtplenarprotokoll>
```

### Field mapping

| Speeches column | XML source |
|---|---|
| `id` | `<rede id>` (already globally unique like `ID215400100`) |
| `session_id` | `21-{sitzungsnr from kopfdaten}` |
| `agenda_item` | `<tagesordnungspunkt top-id>` (the whole label like `"Tagesordnungspunkt 25"` or `"Zusatzpunkt 7"`) |
| `vote_id` | resolve via existing helper: prefer (session, top) match against `votes.bundestag_id`, fall back to date |
| `speaker_member_id` | join `<redner>` data to `members` (slug lookup), null when role is set |
| `speaker_name` | `[titel, vorname, nachname, namenszusatz].filter().join(' ')` |
| `speaker_role` | `<rolle_lang>` ?? `<rolle_kurz>` ?? null |
| `party` | `<fraktion>` text ?? null (mutually exclusive with role) |
| `date` | `<datum date>` from kopfdaten, normalize DD.MM.YYYY → YYYY-MM-DD |
| `position` | running ordinal within session (1..N in document order) |
| `text_full` | concatenate `<p klasse="J\|J_1\|O">` children of `<rede>`, drop the leading `<p klasse="redner">`, drop `<kommentar>` (or store separately later) |
| `text_excerpt` | first 280 chars of `text_full` |
| `word_count` | `text_full.split(/\s+/).filter(Boolean).length` |
| `source_url` | `https://dserver.bundestag.de/btp/21/21{NNN}.xml` |

### Quirks to handle

- **Speaker continuation:** after a speech ends, the XML often has `<name>Präsidentin Julia Klöckner:</name>` + `<p klasse="J_1">` inside the *same* `<rede>` element — this is the Präsident briefly speaking before the next `<rede>` begins. Decide: split into separate rows, or attach to one. **Decision: split.** Each distinct speaker = one row. Track via inner `<name>` tags that are not `<redner><name>`.
- **`<kommentar>`:** drop from `text_full`. Optionally store as `interjections` JSON later — out of scope for v1.
- **MdB-ID:** `<redner id="...">` carries the DIP MdB-ID. Our `members.id` is slug-based (`kaufmann-michael`). Two paths: (a) name-based lookup like current ETL, (b) backfill `members.dip_id` column. **v1: name-based**, log how many would have matched by DIP id for the follow-up.
- **Government IDs:** `<redner id="999...">` for ministers — these are synthetic, not real MdB-IDs.
- **HTML in `<p>`:** `<a href>` links to Drucksachen appear inside paragraphs. Strip tags, keep text.
- **Date format:** `<datum date="03.07.2025">` → `2025-07-03`.

## Deliverables

```
etl/bundestag-reden-xml/
  fetch.ts        # download missing protocols to raw/xml/, probe by HEAD until 404
  parse.ts        # XML → SpeechRow[] (pure, no DB)
  ingest.ts       # parse all raw/xml/*.xml, upsert into speeches table
  package.json    # add fast-xml-parser
```

`package.json` script: `etl:speeches:xml`.

## Schema changes

None required. `speeches.agenda_item` already exists (currently always null). After this lands it gets populated.

Optional follow-up: add `members.dip_id` column to enable direct MdB-ID joins, backfill from abgeordnetenwatch or DIP API.

## Vote linkage strategy

`votes.bundestag_id` is just an integer in our schema (e.g. `1003`), not a TOP-bearing string. So even with TOP in hand, we can't join `(session, top) → vote` without a bridge. Plumber needs to investigate:

1. Does `votes` have any field that encodes the TOP, or could we derive one from `dip` ETL?
2. If not, can we scrape the TOP from the DIP API for each vote and add `votes.agenda_item`?

If a bridge exists or can be built, vote coverage jumps from ~12/300 toward ~all. If not, we stay on the session+date heuristic and TOP is purely for display (still useful — speeches grouped by debate topic on the session page).

## Open questions

- Lead: do we keep CPP-BT ingest around as a backup, or rip it out once XML parser proves itself for sessions 1–78? Recommendation: keep parquet+raw checked-in for one release cycle, then delete.
- Plumber: name-match vs DIP-ID match — do the numbers in the XML actually align with any id we have elsewhere (abgeordnetenwatch?)? Worth a 30-min spike.

## Status

- todo: plumber implements fetch + parse + ingest, runs against sessions 1–78, reports linkage numbers.

## Log

- 2026-05-12 lead: plan created. Sample XML for sessions 1 + 54 downloaded to `etl/bundestag-reden/raw/xml/` for plumber to work against. URL pattern + element shape confirmed. Latest session is 78.
- 2026-05-12 plumber: shipped `etl/bundestag-reden-xml/` with `fetch.ts`, `parse.ts`, `ingest.ts`. CPP-BT ingest left untouched per plan.

  Fetch: probes `21{NNN}.xml` from 1 upward, stops after 3 consecutive 404s (defensive vs. one-off gaps). Idempotent via on-disk check, `--force` overrides. Pulled sessions 1–78 (76 new + 2 pre-seeded samples).

  Parser: built on `fast-xml-parser` in preserveOrder mode so the in-document sequence of `<p klasse="redner">`, mid-rede `<name>`, and `<p klasse="J|J_1|O">` is exactly walked. Splits each `<rede>` into one row per distinct speaker — Präsidenten interruptions become their own segments. When a `<rede>` produces >1 segment the row id is `<rede id>#<segIndex>`; single-segment redes keep the bare id. `<kommentar>` is dropped; inline `<a>` tags inside paragraphs are flattened (text-only). Date normalized `DD.MM.YYYY → YYYY-MM-DD`. `agendaItem` lifted verbatim from `<tagesordnungspunkt top-id>`.

  Ingest: delete-then-insert per session (idempotent, also wipes any overlapping CPP-BT rows from sessions 1–53). Reuses the slug + honorific-strip name matcher from `etl/bundestag-reden/ingest.ts`. Vote linkage uses the same `votesBySession` + `votesByDate` fallback because the TOP → vote bridge does not exist (see open-question 2 below).

  Coverage:
  - 78 sessions parsed, 25 463 speeches stored (vs. 6 167 from CPP-BT on sessions 1–53 — XML splits inflate row count ~4x because each Präsidenten-interjection becomes its own row).
  - `agenda_item` populated on 25 463 / 25 463 (100%). Was 0/6167 with CPP-BT. 124 distinct TOP labels.
  - Speaker linkage: 12 195 matched to `members`, 13 266 role-based (Bundesminister/Vizepräsident/etc.), 2 genuinely unmatched (`Neuhäuser, Charlotte` and `Otte, Henning` — both single occurrences, likely Nachrücker not in `members` yet, no action needed).
  - Vote linkage: 6 082 speeches → vote, 19 distinct votes covered (out of 300 in 21. BT). Marginal gain over CPP-BT's 1631/12 because both still use the session/date heuristic. The 5x row-count growth multiplies hit count per matched vote but doesn't cover more votes.
  - Per-fraktion (real MdB speeches): CDU/CSU 3535, AfD 3005, SPD 2086, B90/Grüne 2065, Die Linke 1456, fraktionslos 50. Government roles 1860, Vize/Präsidenten 11 299.

  New quirks vs. CPP-BT:
  - `SchulzeSchulze, SvenjaSvenja, SPDSPD` doubling exists in the **upstream protocol XML directly**, not the parquet. Applied the same `dedupeRepeat` collapse to `vorname`, `nachname`, and `fraktion`. Without it: 13 unmatched speakers; with it: 2.
  - `<rede>` order is not always "klasse=redner first, then continuations". Example session 21054 last rede: Vizepräsident speaks via `<name>` then Tobias Winkler enters via `<p klasse="redner">`. Splitter handles both orderings; the segment that originates from `<p klasse="redner">` is flagged `continuation=false`. If multiple non-continuation segments occur within one rede (rare but possible — e.g. ID collides via Zwischenfrage), suffix `#index` is applied to ALL segments of any multi-segment rede so ids stay unique. Verified zero duplicates across 25 463 rows.
  - Government dipIds use the `999...` synthetic range (Wildberger = `999990153`); real MdB dipIds are 8 digits starting `1100...`. Captured but not yet stored in DB (see open-question 1).
  - Session 21001 (konstituierende Sitzung): TOPs are labeled "Zur Geschäftsordnung", "Tagesordnungspunkt 1", "Tagesordnungspunkt 2", etc. — different label set from regular sessions, but the same `top-id` attribute. No special handling needed.

  Open question 1 (DIP-ID matching): **No, the XML `<redner id>` does not match any id we currently store.** Investigation:
  - XML uses `<redner id="11004617">` for Ronja Kemmer (Bundestag-MdB-Stammdaten-ID, 8 digits starting `1100`).
  - Our `members.dip_person_id` for Kemmer is `1924` — that's the DIP **search API** person-id (different system).
  - Our `member_affiliations` uses our slug-based `members.id`.
  - abgeordnetenwatch uses `politicianId` (yet another integer namespace).
  Verified by querying DIP `/person/1924`: returns Kemmer, but the response doesn't surface the `11004617` MdB-ID anywhere. The Bundestag-MdB-Stammdaten-ID is published separately at `bundestag.de/static/appdata/filter/opendata.csv` (MdB-Stammdatensatz). Recommendation: add a `members.bt_mdb_id` (integer) column and bootstrap it from the MdB-Stammdaten XML (`https://www.bundestag.de/resource/blob/.../MdB-Stammdaten-data.zip`). Once populated, the XML parser can match speakers in O(1) by id, killing the 2 remaining name-collision unmatches and any future ones from members with title/name drift. Not blocking — name match is at 99.98% (12 195 + 13 266 + 2 = 25 463; unmatched = 2 = 0.008% of non-role speakers).

  Open question 2 (votes.agenda_item via DIP): **No, DIP does not expose TOP per vote.** Investigation:
  - Sampled `/vorgang`, `/vorgangsposition`, `/aktivitaet`, `/plenarprotokoll` endpoints. None carries a `tagesordnungspunkt` / `top` / `top_id` field.
  - `/plenarprotokoll` returns a `vorgangsbezug` array listing Vorgänge discussed in that protocol, but only via Vorgang **id** and title — not bound to a TOP number.
  - `/vorgangsposition` has the Drucksache id and the fraction-author but no TOP.
  - DIP's `f.aktivitaetsart=Namentliche+Abstimmung` filter is silently ignored (returned Kleine Anfragen). Even with right filter we wouldn't get TOP — it's just not a field DIP indexes.
  Conclusion: the only way to bridge `(session, top) → vote` is to parse the Plenarprotokoll XML's `<sitzungsverlauf>` ourselves and look for the `Namentliche Abstimmung` / `Ergebnis der Abstimmung` block — those blocks sit inside a `<tagesordnungspunkt>` so the TOP is on hand. That's a separate ETL (the namentlich-vote ingest currently reads a different upstream — `bundestag.de/parlament/.../abstimmung/...`). Either:
  (a) Extend `etl/bundestag-reden-xml/parse.ts` to also emit `(session, top, voteRef)` triples for any rede that contains an "Ergebnis der namentlichen Abstimmung über ..." paragraph and store them in a new `vote_agenda_items` join table, OR
  (b) Add a `votes.agenda_item` column and backfill from the namentlich-vote XML which also carries the top-id wrapper.
  Recommend (b) — simpler, lives next to `votes` schema, single backfill. Plan as a follow-up; not in scope for this PR.

  Files: `etl/bundestag-reden-xml/{fetch,parse,ingest}.ts`, `etl/bundestag-reden-xml/package.json`, root `package.json` (added `etl:speeches:xml`, `etl:speeches:xml:fetch`, `etl:speeches:xml:ingest`), `etl/bundestag-reden-xml/.gitignore` (raw/). DB changes: 25 463 speech rows inserted, FTS5 mirrors auto-synced via existing triggers (verified `speeches_fts` count matches). No schema migration. CPP-BT ingest left in place per plan.
