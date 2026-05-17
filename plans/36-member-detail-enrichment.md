# 36 - Member detail enrichment

## Goal

Make `/members/:id` feel like a complete public profile for an active Bundestag member, without turning it into a biography page.

The page should answer three questions quickly:

1. Who is this person?
2. What do they do in parliament?
3. Which Antraege or Gesetzentwuerfe did they help bring into votes?

This plan scopes the work only. No implementation in this plan-opening turn.

## Status

| Workstream | Owner | State |
|---|---|---|
| Lead: product scope and data inventory | lead | done |
| Designer: updated ASCII mock for member detail | designer | todo |
| Backend: member profile enrichment contract | backend | todo |
| Backend: member Antraege contract | backend | todo |
| Frontend: presentational member detail changes | frontend | todo |
| Tester: desktop and mobile smoke pass | tester | todo |

## Existing data

### Profile facts

`members`

- `id`, `name`, `first_name`, `last_name`
- `bt_mdb_id`
- `picture_url`, `picture_author`, `picture_license`, `picture_source_url`
- `mandate_type`, `list_state`, `constituency_number`, `constituency_name`

`member_abgeordnetenwatch.raw_json`

- `abgeordnetenwatch_url`
- `sex`
- `year_of_birth`
- `occupation`
- `education`
- `residence`
- `party`
- `party_past`
- `statistic_questions`
- `statistic_questions_answered`
- `qid_wikidata`
- `field_title`

Current coverage in local DB:

- 621 `member_abgeordnetenwatch` rows
- 621 with `sex`
- 567 with `year_of_birth`
- 546 with `occupation`
- 518 with `education`
- 313 with `residence`
- 621 with `qid_wikidata`
- 581 active members with a portrait on `members.picture_url`

### Mandate and party context

`member_affiliations`

- party or faction by term
- `valid_from`, `valid_to`
- current active members from term 21

`member_mandates`

- historical mandate rows across terms 1 to 21
- term, mandate type, list state, constituency, valid range

Current active term counts:

- 635 active affiliation rows
- 276 direct mandates
- 359 list mandates
- 614 with constituency number and name

### Activity

Votes:

- `vote_members` gives member choice for each named vote
- `votes` gives date, title, clean title, result, procedural flag, petition bundle flag
- current member page already derives attendance, loyalty, defections, and vote history

Speeches:

- `speeches` links `speaker_member_id` to full text, excerpt, date, session, role, party, and optional vote
- 582 active members currently have at least one linked speech

Anfragen:

- `anfrage_signatories` links members to Kleine Anfrage, Grosse Anfrage, and Schriftliche Frage
- 341 active members currently have at least one linked Anfrage

Antraege:

- `antraege` stores Antrag and Gesetzentwurf rows
- `antrag_signatories` links members to co-signed Antrag or Gesetzentwurf rows
- `vote_antraege` links those rows to votes by Drucksache
- 833 Antraege or Gesetzentwuerfe
- 12,417 Antrag signatory rows
- 383 active members with at least one linked Antrag or Gesetzentwurf
- 157 vote to Antrag links

Important wording decision: call these `Anträge` in German and `Proposals` in English, not `Initiativen` or `Petitionen`. `votes.is_petition_bundle` is a separate vote-level flag for bundled petitions. It does not mean we know individual petition authors.

### Sample findings

Random active-member sample from local DB on 2026-05-17:

| Member | Profile fields | Mandate data | Antrag data |
|---|---|---|---|
| Asghari, Prof. Dr. Reza | occupation `Professor`, education `Doktor der Wirtschaftswissenschaften`, birth year 1961 | list, Niedersachsen, constituency field also present | 0 Antraege, 17 speeches, 0 Anfragen |
| Bettermann, Daniel | occupation `Angestellter`, education `Masterabschluss Politikwissenschaften`, birth year 1980 | direct, Hessen, Kassel | 0 Antraege, 26 speeches, 0 Anfragen |
| Guerpinar, Ates | occupation `Angestellter`, education `Medienwissenschaftler`, birth year 1984 | list, Bayern, constituency field also present | 41 Antraege, 2 linked votes, 51 speeches, 166 Anfragen |
| Krings, Prof. Dr. Guenter | occupation `MdB`, education `Studium der Rechtswissenschaften`, birth year 1969 | direct, Nordrhein-Westfalen, Moenchengladbach | 0 Antraege, 15 speeches, 0 Anfragen |
| Pantisano, Luigi | occupation empty, education `Dipl.-Ing. Architekt und Stadtplaner`, birth year 1979 | list, Baden-Wuerttemberg, constituency field also present | 31 Antraege, 1 linked vote, 32 speeches, 109 Anfragen |
| Reisner, Lea | occupation `MdB Mitarbeiterin`, education `Gesundheits- und Krankenpflegerin`, birth year 1989 | list, Nordrhein-Westfalen, constituency field also present | 20 Antraege, 0 linked votes, 16 speeches, 135 Anfragen |
| Spahn, Jens | occupation `MdB`, education `Bankkaufmann`, birth year 1980 | direct, Nordrhein-Westfalen, Steinfurt I - Borken I | 0 Antraege, 20 speeches, 0 Anfragen |
| Uhlig, Katrin | occupation `MdB`, education empty, birth year 1982 | list, Nordrhein-Westfalen, constituency field also present | 41 Antraege, 7 linked votes, 25 speeches, 95 Anfragen |
| Vollath, Sarah | occupation `Leitung oGts`, education `Sozialarbeiterin`, birth year 1995 | list, Bayern, constituency field also present | 58 Antraege, 4 linked votes, 18 speeches, 151 Anfragen |
| Zimmer, Diana | occupation `Controllerin`, education `Betriebswirtin (B.Sc.)`, birth year 1998 | list, Baden-Wuerttemberg, constituency field also present | 40 Antraege, 9 linked votes, 18 speeches, 79 Anfragen |

Implications:

- `occupation` is useful but sometimes low-information, especially `MdB`.
- `education` is often useful, but can be empty or phrased inconsistently.
- For list mandates, `list_state` is the right visible geography. `constituency_name` is often still populated and should not be displayed as if it were the won mandate.
- Antrag counts are politically informative for opposition members in this sample. Some coalition or government members have zero member-signed Antraege, which is expected.
- Linked votes often exist without a `vote_members` choice for that member, because not every linked vote has individual named-vote rows. UI should show the vote result and show member choice only when available.

## Product decisions

### Header

Keep the top of the page focused. The header should show:

- portrait
- name
- party badge
- state
- age if birth year exists
- mandate badge
- constituency or list state
Do not put a long biography in the header.

### Header facts

Recommended header metadata:

- Ausbildung, from `education`
- Alter, from `year_of_birth`
- Mandat, direct or list
- Wahlkreis or Landesliste

Display only present values. No empty rows. Do not show occupation or external profile sources in v1.

Education can be long, uneven, or upstream-written in prose. The UI should allow wrapping but avoid making the header taller than the activity view. If a value is very long, show one or two lines with a disclosure pattern decided by the designer.

Do not show `residence` by default. It is public upstream data, but it is less parliamentary than constituency or list state, has lower coverage, and can read as personal-location information.

### Political context

Make party changes visible if there is more than one current-term affiliation row for a member:

- current faction in the header
- small line in `Profil`, for example `seit 2025 fraktionslos` or a simple timeline row

This matters because vote-line loyalty depends on party at vote date.

### Activity summary

Current stat tiles are useful but too vote-heavy. Keep the existing vote stats, then consider a second compact activity row:

- Reden count
- Anfragen count
- Anträge count
- Anträge mit Abstimmung count

This should not replace the detailed tabs. It gives scanning context.

### New Antraege surface

Replace the standalone `Anfragen` tab with an `Anträge` tab for Antraege and Gesetzentwuerfe the member co-signed.

Reason: Anfragen are useful as parliamentary oversight activity, but on an individual profile they can be hard to interpret. Many rows are faction-driven or mass-signed, and a list of questions does not connect as directly to voting behavior. Antraege linked to Abstimmungen tell a clearer story: what this member helped bring forward, whether parliament voted on it, how the vote ended, and how the member voted.

Keep Anfragen as a secondary signal:

- count in the compact activity summary
- clickable activity row that opens an Anfragen modal
- no standalone tab in v1

Anfragen modal contract:

- opens from the activity summary row, not from a top-level tab
- shows recent Anfragen signed by the member
- grouped by type: Kleine Anfrage, Grosse Anfrage, Schriftliche Frage
- each row shows title, question date, answer date if present, Drucksache, initiative faction, and PDF links
- keep the modal lightweight, no filtering in v1
- close returns the user to the same member profile state
- empty state is not shown as a modal trigger

Each row should show:

- title
- introduced date
- parliamentary status
- topic descriptors if present
- number of co-signers
- linked vote result where there is one linked vote

When an Antrag has multiple linked votes, show the most relevant linked vote first:

1. non-procedural final vote if recognizable from current fields
2. newest linked vote
3. otherwise first linked vote by date

If there is no linked vote, show it as an Antrag without recorded Abstimmung. That is still useful.

### Cross-links

From an Antrag row:

- link to the linked vote when available
- link the Drucksache PDF when available
- keep member profile as the place for member-specific context, not a full DIP clone

### Language

German UI:

- `Profil`
- `Beruf`
- `Ausbildung`
- `Alter`
- `Mandat`
- `Wahlkreis`
- `Landesliste`
- `Anträge`

English UI:

- `Education`
- `Age`
- `Mandate`
- `Constituency`
- `State list`
- `Proposals`

## Backend contract

Extend `MemberDetail` with education and member initiatives.

```ts
export type MemberDetail = {
  education: string | null
  initiatives: MemberInitiativeRow[]
}
```

Add a member initiatives contract:

```ts
export type MemberInitiativeRow = {
  antragId: number
  title: string
  beratungsstand: string | null
  introducedDate: string | null
  drucksachePdfUrl: string | null
  sachgebiet: string[]
  signatoryCount: number
  linkedVotes: MemberInitiativeVote[]
}

export type MemberInitiativeVote = {
  voteId: string
  date: string
  title: string
  cleanTitle: string | null
  result: 'angenommen' | 'abgelehnt'
}
```

Query direction:

```
antrag_signatories WHERE member_id = ?
  -> antraege
  -> vote_antraege
  -> votes
```

The route loader must fetch this data at build time. Do not call server functions from `useQuery`.

## Frontend contract

Views stay presentational.

Likely files:

- `apps/bundestag/src/views/memberDetail/memberDetail.enrichment.mock.md`
- `apps/bundestag/src/views/memberDetail/ProposalsTab.tsx`
- `apps/bundestag/src/views/memberDetail/ProposalRow.tsx`

Routes stay thin and pass loader data into views.

Hooks can hold derived display state if sorting or filtering is added. Do not add filtering in v1 unless the rows are too many to scan.

## Suggested default layout

```
+------------------------------------------------------------+
| portrait  Name                                             |
|           Partei  Bundesland  Alter  Mandat                |
|           Wahlkreis or Landesliste                         |
|                                                            |
| stats: Anwesenheit  Treue  Abweichungen  Abstimmungen      |
| stats: Reden        Anträge                                |
|                                                            |
| [Abstimmungen] [Reden] [Anträge]                           |
|                                                            |
| Antrag row                                                 |
| 2026-05-15  in Beratung  20 Unterzeichner                  |
| Kryptowerte streng regulieren und gerecht besteuern        |
| Abstimmung: abgelehnt                                      |
+------------------------------------------------------------+
```

## Non-goals

- No committee memberships unless a new source is ingested.
- No Nebenverdienste unless a new source is ingested.
- No private biography prose.
- No ranking members by education, age, occupation, or residence.
- No claiming lead authorship. DIP gives signatory rows, not reliable lead author roles.
- No individual petition authors. `is_petition_bundle` is vote metadata only.
- No standalone Anfragen tab in v1. Do not show Anfragen on the member overview until the interaction is deliberately scoped again.

## Open questions

- Should `education` get a two-line clamp, or should the full upstream value always be visible?
- Should the new activity counts be tiles, inline pills, or a compact table row?
- Should government bills with zero member signatories appear anywhere on member pages? Current answer: no, because they are not member-authored.

## Log

- 2026-05-16 lead: plan opened after operator asked to scope an enriched active-member detail page. Clarified that "petitions" means Antraege connected to Abstimmungen. Data inventory pulled from current schema, plan 18, plan 26, plan 28, and local DB counts. No implementation started.
- 2026-05-17 lead: operator questioned the value of a standalone Anfragen tab and raised caution around residence. Scope updated: replace Anfragen tab with an Antrag surface in v1, keep Anfragen as a secondary count, and do not show residence by default.
- 2026-05-17 lead: operator suggested keeping Anfragen accessible as a row that opens a modal. Scope updated: Anfragen remain out of top-level tabs, but the activity summary gets a clickable Anfragen row with a lightweight recent-Anfragen modal.
- 2026-05-17 lead: implemented v1. Member detail now loads profile facts, signed Antraege with linked votes, and signed Anfragen. The UI shows profile facts, an activity summary, an Anfragen modal, and a new Anträge tab in German and English. Production build passes. TypeScript still has pre-existing failures in the English legal routes and party cohesion type.
- 2026-05-17 lead: narrowed the overview stats to the shared tile style. Reden and Anträge join the existing stats; Anfragen and Mit Abstimmung are hidden for now. Antrag rows link to vote details when present but no longer show the member's own choice. The vote-Antrag linker is being expanded to use deterministic DIP position Drucksachen as aliases.
- 2026-05-17 lead: validated the expanded linker against `vote_antraege`. A broad recursive alias pass incorrectly matched Plenarprotokoll and shared Unterrichtung Drucksachen, so the linker was tightened to direct Antrag Drucksachen first, then Beschlussempfehlung aliases only when no direct Drucksache is present. Current DB rows remain unchanged at 157, with no lost links.
- 2026-05-17 lead: production build passes and prerenders German and English initiative routes. TypeScript still reports only the pre-existing English legal route `links` shape errors and the party cohesion nullability error.
- 2026-05-17 lead: operator asked to remove the separate profile block. Ausbildung now belongs in the compact header metadata row; occupation and profile sources are removed from the member detail read path.
- 2026-05-17 lead: operator clarified that the visible German label should be Anträge, not Initiativen. Routes changed to `/members/:id/antraege/` and `/en/members/:id/proposals/`; rows and loader data were trimmed to date, status, signatories, PDF, topics, and the linked vote result.
