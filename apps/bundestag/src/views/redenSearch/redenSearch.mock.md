# /speeches

Round 18 of plan 105. Card-language rehaul of the speeches feed plus the content fix
from the round-14 design note: the default browse feed is ~50% presidium handover rows
(incl. bare "Vielen Dank." entries) and interjections split member speeches into
mid-sentence fragments. Both are fixed at the data layer of this page (the static
search pipeline), not by hiding rows in the view.

## Feed content (what a row IS, before any layout)

1. **Presidium rows leave the feed.** Rows whose `speakerRole` is presidium
   (Präsident/Präsidentin, Vizepräsident/in, Alterspräsident/in) are dropped from
   `speeches-meta.json` at generation time. They stay in the DB, in the text shards,
   and in the vote-detail DebateList, where they carry debate flow.
2. **Fragments merge.** Consecutive meta entries with the same date + debate group +
   speaker (adjacent once presidium rows are gone) collapse into ONE feed entry: first
   fragment's id + excerpt, an `ids` array carrying all fragment ids in order.
   Expanding renders the concatenated full texts. No more rows starting mid-clause.
3. **Ministers stay.** Role rows that are government members speaking in function
   (role not matching the presidium patterns) are content; the role renders as a
   sub-line under the name.
4. **Stance where derivable.** When the speech links to a namentliche Abstimmung and
   the speaker cast a ballot on it, the row shows the existing VoteChoicePill
   (JA/NEIN/ENTHALTEN), same as member-detail speech rows.

## Layout, mobile (390)

No masthead, no intro sentence (feed rule). Search input first, it is the page's
identity. The three filters move behind the floating filter pill + bottom sheet
(house mobile-feed idiom); no pill row on mobile.

```
+---------------------------------------------+
| Machtblick (app nav, sticky)            =   |
|                                             |
| [ (o) Reden durchsuchen................. ]  |  <- search input, full width,
|                                             |     existing style
| 16.204 REDEN                                |  <- count caption: text-s caps
|                                             |     opacity-l (honest count,
| 25. JUNI 2026                               |     post-moderation)
| .-----------------------------------------. |  <- day caption: text-s caps
| | (foto) Anna Beispiel  (logo)      [ JA ] | |     opacity-l, ls 0.08em
| |                                          | |
| | Zur Abstimmung: Mietpreisbremse bis      | |  <- speaker line: photo 36 rund,
| | 2029 verlängern                          | |     name text-m semibold ->
| |                                          | |     /members/:id/, PartyLogo 16
| | „Wer heute in unseren Städten eine       | |     -> party page; stance pill
| | Wohnung sucht, weiß, warum wir dieses    | |     right-aligned (only when
| | Gesetz verlängern müssen. Die Mieten     | |     ballot known)
| | steigen schneller als die Löhne, und…"   | |
| |                                          | |  <- vote link: text-s opacity-l,
| | Ganze Rede lesen                     v   | |     own tap target
| '-----------------------------------------' |
| .-----------------------------------------. |  <- excerpt: Charter serif text-m,
| | (foto) Bernd Beispiel (logo)             | |     clamp 4; search hits keep the
| |        BUNDESMINISTER DER FINANZEN       | |     existing <<mark>> highlight
| |                                          | |
| | Zur Abstimmung: Bundeshaushalt 2025      | |  <- minister: role sub-line
| | „Dieser Haushalt ist der größte          | |     text-s caps opacity-l under
| | Investitionshaushalt in der Geschichte   | |     the name; no stance pill
| | der Bundesrepublik, und er ist solide…"  | |     when no ballot
| |                                          | |
| | Ganze Rede lesen                     v   | |  <- expand affordance: text-s
| '-----------------------------------------' |     opacity-l + chevron; open =
|                                             |     full text in the card, serif,
|              ( Filter · 0 )                 |     chevron flips, label "Einklappen"
|                                             |
|  <  1  2  ...  2026  >                      |  <- Pager unchanged (1-indexed)
+---------------------------------------------+
```

- Card: white `background`, 1px `text @ opacity-s` border + soft double shadow,
  radius 0, padding l, mb-m between cards. No top-edge chip (a speech has no verdict;
  the stance pill is the speaker's ballot, inline right).
- The card is NOT a stretched link; it is the expand button (existing
  role="button" behavior). Name, party logo, and vote link are z-raised links
  with stopPropagation, exactly like today.
- Floating filter pill bottom center (`fg` fill, funnel icon, "Filter · n"), opens
  the bottom sheet with three caption-labeled groups: Fraktion, Tag, Abgeordnete:r
  (member group = the existing typeahead, rendered as a search field inside the
  sheet). Same URL semantics as the pills.

## Layout, desktop (>= 700px, max-w-3xl, same cards)

```
| Machtblick   Abstimmungen  Abgeordnete  Reden  Fraktionen        [Deutsch v]    |
|                                                                                 |
|  [ (o) Reden durchsuchen......................................................] |
|  v [Fraktion v] [Tag v] [Abgeordnete:r v]                                       |  <- FilterPillRow, sticky
|                                                                                 |     under app nav
|  16.204 REDEN                                                                   |
|                                                                                 |
|  25. JUNI 2026                                                                  |
|  .----------------------------------------------------------------------------. |
|  | (foto)  Anna Beispiel  (logo)                                       [ JA ]  | |
|  |         Zur Abstimmung: Mietpreisbremse bis 2029 verlängern                 | |
|  |                                                                             | |
|  |  „Wer heute in unseren Städten eine Wohnung sucht, weiß, warum wir          | |
|  |  dieses Gesetz verlängern müssen. Die Mieten steigen schneller als          | |
|  |  die Löhne, und die <<Mietpreisbremse>> ist das einzige Instrument…"        | |
|  |                                                                             | |
|  |  Ganze Rede lesen                                                       v   | |
|  '----------------------------------------------------------------------------' |
|                                                                                 |
|  .----------------------------------------------------------------------------. |
```

Same component, reflowed: vote link moves up beside/under the name block (one
header grid `[36px 1fr auto]`), excerpt clamp 3. Everything else identical.

## Filters / interactions

- Search: full-text over the static shards, unchanged mechanics, `<<hit>>` marks
  render as highlight.
- Fraktion / Tag / Abgeordnete:r: desktop FilterPillRow (funnel icon lead), mobile
  bottom sheet. URL params unchanged.
- Card tap (or Enter/Space) toggles the full text inline; merged fragments render
  as one continuous text with a thin blank line between fragments.
- Pager: existing windowed Pager, 1-indexed URLs (round-17 fix), page size raised
  5 -> 8 (cards are denser than the old rows; fewer of the 2000+ pages).

## Why

A citizen scanning the feed should see only people saying things: who spoke, for
which party, on which vote, which way they voted, and their strongest lines in
their own (serif) words; the procedural scaffolding of the chamber stays on the
vote pages where it explains debate flow.

## Implementation notes (data needs, flag for lead/frontend)

- **No server-function change.** /speeches runs entirely on the static pipeline
  (`vite.config.ts writeSpeechesStatic` + `lib/speechesStatic.ts`). All changes are
  generator + lib + view:
  - Generator: drop presidium rows from `speeches-meta.json` via a role-pattern
    match (`^(Alters|Vize)?Präsident`); KEEP all ids/texts in
    `speeches-search-*.json` shards (DebateList's `useSpeechBody` resolves texts
    by id from the shards and must keep working for presidium rows on vote pages).
  - Generator: fragment merge (same date + `debate_group_id`, fallback
    `agenda_item`, + same `speaker_name`, adjacent after the drop) -> one entry
    with `ids: string[]`; excerpt/position from the first fragment.
  - Generator: add `choice` per entry (join the linked vote's member ballot for
    `speaker_member_id`), values yes/no/abstain/null; skip nicht_abgegeben (no pill).
  - Photos: do NOT inline `pictureUrl` per entry (16k rows of long URLs bloat
    meta). Emit a second tiny file `speeches-people.json` (memberId -> pictureUrl,
    ~630 entries), loaded once alongside meta; initials fallback stays.
  - `lib/speechesStatic.ts`: `SpeechMetaEntry` gains `ids`, `choice`; search matches
    against the concatenation of the merged texts; total counts drop accordingly.
  - `hooks/useSpeechBody`: accept `ids: string[]` (default `[id]`), join shard
    texts with a blank line. DebateList keeps passing a single id.
- `searchSpeeches` in `server/speeches.ts` (build-time only, unused by this page)
  is untouched; member-detail speech tabs (server data) are untouched.
- SpeechRow is shared with DebateList and memberDetail: add the card variant as a
  wrapper (`SpeechCard`) around the existing row internals rather than forking;
  the plain-row rendering (vote pages, member tabs) keeps its current look.
- Serif = the same Charter `SERIF` stack VoteCard uses. Excerpts get typographic
  quotes only if trivially prependable; otherwise render the raw excerpt without
  quote marks (no fabricated punctuation).
- en locale: meta excerpts are German until shards load (existing behavior);
  unchanged by this design. Counts line and captions localize via existing keys;
  new keys: "Ganze Rede lesen"/"Einklappen" ("Read full speech"/"Collapse").

## Tokens

| Element | Text size | Weight | Spacing | Component |
|---|---|---|---|---|
| Search input | m | regular | mb-m | Input (existing style) |
| Count caption / day caption | s uppercase, ls 0.08em | regular, opacity-l | mb-s / mt-l | — |
| Card | — | — | p-l, mb-m, hairline + double shadow, radius 0 | Card recipe |
| Speaker name | m | semibold | gap-s header row | link |
| Minister role sub-line | s uppercase, ls 0.08em | regular, opacity-l | mt-xs | — |
| Party logo | 16px height | — | — | PartyLogo |
| Stance pill | 11px uppercase, ls 0.14em | semibold, white on choice color | right-aligned | VoteChoicePill |
| Vote link | s | regular, opacity-l -> 100 on hover | mt-xs | link |
| Excerpt / full text | m serif (Charter), leading 1.45 | regular | mt-s, clamp 4 (mob) / 3 (desk) | — |
| Expand affordance | s | regular, opacity-l | mt-s | chevron 17 |
| Filter pills / sheet | existing | — | — | FilterPill(Row), FilterSheet, floating pill |
| Pager | existing | — | mt-l | Pager |

Colors: choice colors only (success/danger/yellow) on the stance pill; party color
only in the logo. Radius 0; avatar circles and the floating filter pill are the
sanctioned exceptions.
