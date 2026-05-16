# 02 — Bundestag: Ingest Handzeichen / Hammelsprung votes

## Goal

Expand votes coverage from 51 namentliche to the full set of Bundestag floor votes (21. WP, ~78 sessions so far → estimated 400–1000 additional Handzeichen + Hammelsprung votes). List view gains a filter for vote type; detail view shows what's available per type.

## Source

DIP API: `https://search.dip.bundestag.de/api/v1/plenarprotokoll-text/<id>?apikey=...&format=xml`
- 78 documents for `f.wahlperiode=21 f.zuordnung=BT`
- Each protocol's `<text>` contains the full stenographic transcript, including all Abstimmung blocks as free German prose

## What's extractable per vote type

| Field | Namentlich | Handzeichen | Hammelsprung |
|---|---|---|---|
| Title / Drucksache | yes | yes | yes |
| Date | yes | yes | yes |
| Outcome (ang./abg.) | yes | yes | yes |
| Per-Fraktion position (ja/nein/enth) | yes (derived) | yes (text) | yes (text) |
| Numerical counts | yes | **no** | yes |
| Per-MP votes | yes | **no** | **no** |

## Schema changes

- `votes.vote_type`: `'namentlich' | 'handzeichen' | 'hammelsprung'`, NOT NULL, default `'namentlich'` for migration
- `votes.yes/no/abstain/absent/total_members`: make NULLABLE (handzeichen has no counts)
- `vote_party_summaries`: add `position` `'yes'|'no'|'abstain'|'mixed'`, make count columns NULLABLE
- For pie-chart-in-card on handzeichen rows: derive ja/nein/enth visual sizes from current Fraktion seat counts (approximation, ignores absences and Abweichler — acceptable at card size)

## ETL pipeline (`etl/bundestag/handzeichen/`)

1. **fetch**: list all 21. WP protocols via DIP `plenarprotokoll` endpoint, download each XML, cache by `dokumentnummer`
2. **segment**: split `<text>` into Abstimmung blocks. Boundary: from "Wir kommen zur Abstimmung über..." (or "Tagesordnungspunkt N: ...") through the next "angenommen/abgelehnt" sentence
3. **classify**: detect type
   - "namentliche Abstimmung" → skip (we already have these from seed)
   - "Hammelsprung" → hammelsprung
   - else → handzeichen
4. **parse outcome** (deterministic regex): outcome verb, party clauses for `mit den Stimmen`, `bei Enthaltung`, `bei Ablehnung`, `bei Zustimmung`, etc. Resolve "Koalitionsfraktionen" → ['CDU/CSU','SPD'], "Antragsteller" → from context preceding "Wir kommen zur Abstimmung über den Antrag der Fraktion(en) X".
5. **LLM verification pass** (Sonnet subagent): batch the parsed rows (original sentence + extracted positions + outcome) and have it flag wrong/missing positions. Apply corrections.
6. **write**: insert into `votes` + `vote_party_summaries`

## Open decisions

- Filter UX in list: a tab/segmented control at the top ("Namentlich · Handzeichen · Alle") or extend the existing filter pill? Default to namentliche to preserve current focus.
- Detail page for handzeichen: drop pie/waffle/defectors entirely; show outcome + per-Fraktion position chips + summary. Make this explicit ("Handzeichen — Einzelstimmen werden nicht erfasst").
- Hammelsprung: same as Handzeichen for now, with the real total counts overlaid. Decide later if separate detail layout needed.
