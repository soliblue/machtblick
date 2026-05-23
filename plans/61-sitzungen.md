# 61 Sitzungen

## Goal

Make plenary sittings a first-class Bundestag concept so vote-less parliamentary activity has a natural home.

## Product Shape

`Sitzungen` should be the chronology layer, not a replacement for `Abstimmungen`, `Antraege`, `Reden`, or `Mitglieder`.

The public model:

- A Sitzung has a date, number, protocol source, agenda, speeches, votes, documents, and motions.
- A Tagesordnungspunkt belongs to one Sitzung.
- A Tagesordnungspunkt can have speeches.
- A Tagesordnungspunkt can have votes.
- A Tagesordnungspunkt can have documents and motions.
- A Tagesordnungspunkt can also have no vote.

First route slice:

- `/sitzungen`
- `/sitzungen/$id`
- Optional later English routes: `/en/sessions`, `/en/sessions/$id`

First page behavior:

- The list page shows sitting number, date, agenda item count, speech count, vote count, document count.
- The detail page shows agenda items in protocol order.
- Each agenda item shows title, documents or Antraege, linked votes, speech count, and source protocol link.
- Member speech rows with no vote link can link to `/sitzungen/$id#<agenda-item-anchor>`.
- Vote pages can link back to their Sitzung and agenda item.

## Data Sources

Primary source is already local:

- `etl/bundestag-reden-xml/raw/xml/*.xml`
- Official upstream URL pattern: `https://dserver.bundestag.de/btp/21/21NNN.xml`

The protocol XML includes:

- Root attributes: Wahlperiode, Sitzung number, date, start time, end time, location, next sitting date, start page.
- `vorspann/kopfdaten`: protocol number, sitting title, official date string.
- `vorspann/inhaltsverzeichnis`: compact table of contents, speakers, page references, documents.
- `sitzungsverlauf/tagesordnungspunkt`: canonical agenda item blocks in spoken order.
- `p klasse="T_fett"` and `p klasse="T_NaS"`: agenda item headings.
- `p klasse="T_Drs"` with document links: Drucksachen for agenda items.
- `rede`: individual speeches already ingested into `speeches`.
- `p klasse="J"` and related paragraph classes: procedural text, referrals, hand votes, named vote announcements.
- `anlagen`: official communications and attachments, useful later but not needed for the first slice.

Existing derived tables already cover part of this:

- `plenary_agenda_items`
- `speech_debate_groups`
- `speech_debate_group_speeches`
- `speech_vote_links`
- `vote_debate_groups`
- `vote_document_roles`

Current local coverage:

- 78 protocol sessions with speeches.
- 714 agenda items.
- 25,463 speech rows.
- 300 current-term non-historical votes in the term 21 vote table.

## Parse Difficulty

Easy:

- Session metadata from root attributes and kopfdaten.
- Agenda item id, order, raw title, cleaned title.
- Protocol source URL.
- Speech counts per session and agenda item.
- Vote counts by joining `votes.date` and `votes.agenda_item`.

Medium:

- Documents per agenda item from `T_Drs` paragraphs, because links can appear as one or many anchors and the text may contain ranges.
- Matching protocol document labels to `antraege`, because an Antrag can be mentioned beside Beschlussempfehlungen, reports, or other documents.
- Stable agenda item anchors, because labels contain spaces, non-breaking spaces, and variants like `Zusatzpunkt 6`, `Einzelplan 25`, or `Tagesordnungspunkt 7d`.

Hard, defer:

- Full semantic parsing of procedural decisions from protocol paragraphs.
- Extracting every hand-vote result from free text.
- Treating Anlagen as structured event data.
- Reconstructing relationships from "in Verbindung mit" blocks without review.

## Schema Plan

Add:

```txt
plenary_sessions
  id text primary key
  term_id integer
  session_number integer
  date text
  title text
  location text
  starts_at text
  ends_at text
  next_date text
  start_page integer
  source_url text
  source_hash text
  review_status text

plenary_agenda_item_documents
  session_id text
  agenda_item text
  document_label text
  document_url text
  document_title text
  antrag_id integer nullable
  source text
  review_status text
```

Extend `plenary_agenda_items`:

```txt
sort_order integer
item_type text
item_number text
source_text text
```

Later, if document reuse becomes messy, replace `plenary_agenda_item_documents` with a canonical `bundestag_documents` table and join tables. The first slice can keep agenda documents local while still storing reviewable facts.

## Materialization Plan

Extend `etl/bundestag-reden-xml/agenda.ts` or split it into protocol parsers:

- `parsePlenarySession(xml)`
- `parseAgendaItems(xml)`
- `parseAgendaDocuments(xml)`

Extend `db/materialize-derived-data.ts`:

- Materialize `plenary_sessions`.
- Add agenda item order and normalized item metadata.
- Materialize documents found under each agenda item.
- Link agenda item documents to `antraege` by exact Drucksache label first.
- Keep fuzzy or range matching out of the first slice unless it produces reviewable low-confidence rows.

Validation queries:

- Every agenda item has a session.
- Every speech with `session_id` links to a session.
- Every speech with `agenda_item` links to an agenda item.
- Every vote with term 21 and a known date links to a session by date when possible.
- Every vote with agenda item links to an agenda item when possible.
- Bachmann vote-less speech groups resolve to a Sitzung agenda item.

## Backend Plan

Add `apps/bundestag/src/server/sitzungen.ts`:

- `getSitzungen()`
- `getSitzung(id)`

Read model for the detail page:

```txt
session
agendaItems[]
  documents[]
  antraege[]
  votes[]
  speechGroups[]
    speakers summary
```

Do not parse XML in server functions. Server functions only read materialized tables.

Add static JSON generation in `apps/bundestag/vite.config.ts` or `vite-data/sitzungen.ts`:

- `/api/sitzungen.json`
- `/sitzungen/$id.json`

Add all session detail pages to `prerenderPaths()`.

## Frontend Plan

Add mocks first:

- `apps/bundestag/src/views/sitzungenList/sitzungenList.mock.md`
- `apps/bundestag/src/views/sitzungDetail/sitzungDetail.mock.md`

List page:

- Dense chronological list.
- Search or simple year filter can wait.
- Show counts as scan aids, not decorative badges.

Detail page:

- Header: `78. Sitzung`, date, time, source protocol.
- Agenda timeline with compact rows.
- Each row title first.
- Secondary metadata: agenda item label, speech count, vote count, document count.
- Inline linked votes and Antraege where present.
- Collapsed speech speakers by default. Full speech text stays on existing Reden surfaces.

Update existing surfaces:

- Member speech group without vote links to the session agenda anchor.
- Vote detail shows Sitzung context.
- Antrag detail can show first known Sitzung appearances later.

## Phasing

### Phase 1

- Add `plenary_sessions`.
- Extend agenda item materialization with sort order and item metadata.
- Add `/sitzungen` and `/sitzungen/$id`.
- Link vote-less member speech groups to Sitzung anchors.
- Prerender German routes.

### Phase 2

- Materialize agenda item documents.
- Link agenda documents to `antraege` by exact Drucksache label.
- Show documents and Antraege on Sitzung detail.

### Phase 3

- Add English routes.
- Add sitemap and JSON endpoint parity.
- Add stronger review tooling for unmatched documents and agenda item documents.

### Phase 4

- Consider canonical `bundestag_documents`.
- Consider structured procedural events from protocol paragraphs.
- Consider Anlagen support.

## Open Questions

- Should the first route label be `Sitzungen` or `Plenarprotokolle` in navigation?
- Should session ids stay `21-78` or use a URL shape like `/sitzungen/21/78`?
- Should `Reden` search results link to the session anchor, the member page group, or remain unlinked until a dedicated speech detail exists?
- Should English session routes ship in the first slice or wait until the German UX is settled?

## Status

Scoped.

## Log

### lead

- Scoped after Bachmann showed the need for vote-less plenary activity to have a first-class home.
- Confirmed existing protocol XML has reliable session metadata and agenda blocks.
- Confirmed local data has 78 protocol sessions, 714 agenda items, and 25,463 speech rows.
- Confirmed current schema has agenda, debate group, speech vote link, vote debate group, and vote document role tables, but no normalized session table.
