# /members/:id (full card-language rehaul)

Round 9 of plan 105. Supersedes the old memberDetail.mock.md entirely and the
Abstimmungen part of votingRecord.mock.md (see "Relation to older mocks" below).
memberSpeeches.mock.md grouping mechanics survive; only the row skin changes here.

Scan signal: **the member's own ballot**. The header states who this person is and
how reliably they show up (two poster stats with bars, grown from the MemberCard
the user just tapped); the Abstimmungen tab opens with the member's choice
fingerprint bar, and every vote row leads with THEIR colored choice chip. The
chamber outcome is demoted to a quiet trailing dot + word (audit finding 4).

## Header, mobile (< 700px, 390 primary)

```
+------------------------------------------+
| Machtblick (app nav, sticky)          =  |
|                                          |
| .----------.  (logo26)                   |
| |          |  Erika                      |  <- name: font-display xxl semibold,
| |  [FOTO]  |  Musterfrau                 |     wraps; party logo 26 above/before
| |  square  |                             |     it, links to /parties/:slug/
| |  112px   |  NIEDERSACHSEN · LANDES-    |  <- meta captions: text-s caps
| '----------'  LISTE · 41 JAHRE ·         |     fg@70, ls 0.08em, separated
|  FOTO: S.H., CC   RECHTSANWAELTIN        |     by ·, wraps freely
|                                          |
| ANWESENHEIT         LINIENTREUE          |  <- caption text-s caps fg@70
| 86%                 94%                  |  <- poster numeral: font-display
| [#############---]  [##############--]   |     semibold 32px tabular-nums
| 8 VON 57 VERPASST   3 ABWEICHUNGEN >     |  <- bar: h-[6px], success fill on
|                                          |     fg@15 track; sub-caption text-s
|                                          |     fg@70; ABWEICHUNGEN is a link
|                                          |     (danger, semibold when > 0)
| [Abstimmungen][ Reden ][ Antraege ]      |  <- tabs keep border-y style;
| [     57     ][   22  ][    30    ]      |     count inside label, fg@40
+------------------------------------------+
```

- Photo: **square, radius 0**, 112px, object-cover; fallback = initials
  (text-xl semibold fg@40) on `surface` — exactly the MemberCard idiom, no
  circles anywhere. Photo credit stays: existing 10px fg@70 truncated line
  under the photo (established exception).
- Party identity = logo only (26px per the detail-page header convention),
  linked. The colored PartyBadge name-pill leaves the header.
- The 6-tile StatTiles grid is deleted from this page. Abstimmungen/Reden/
  Antraege counts move into the tab labels; Abweichungen folds into the
  Linientreue sub-caption; Anwesenheit + Linientreue become the two poster
  stats. Nothing is lost, four redundant tiles are.
- Poster stats: both are positive metrics -> `--color-success` fill on fg@15
  track. Sub-captions carry the absolute numbers ("8 VON 57 VERPASST",
  "3 ABWEICHUNGEN"). The Abweichungen sub-caption is a link into the
  Abstimmungen tab with `lineFilter=abw` (danger + semibold when count > 0,
  plain fg@70 "0 ABWEICHUNGEN" otherwise).
- Fraktionslos / no party line (`loyalty === null`): the LINIENTREUE block
  renders caption + "KEINE FRAKTIONSLINIE" text-s fg@70, no numeral, no bar.

## Header, desktop (>= 700px, container stays max-w-3xl)

```
| Machtblick   Abstimmungen  Abgeordnete  Reden  Fraktionen      [Deutsch] |
|                                                                          |
| .--------.  (logo26) Erika Musterfrau                                    |
| |        |  NIEDERSACHSEN · LANDESLISTE · 41 JAHRE · RECHTSANWAELTIN     |
| | [FOTO] |                                                               |
| | 128px  |  ANWESENHEIT              LINIENTREUE                         |
| |        |  86%                      94%                                 |
| '--------'  [################----]   [##################--]             |
|  FOTO: ...  8 VON 57 VERPASST        3 ABWEICHUNGEN >                    |
|                                                                          |
| [   Abstimmungen 57   ][      Reden 22      ][     Antraege 30    ]      |
```

Same component reflowed: photo left column (128px), identity + stats right.
Stats sit in a 2-col grid under the meta captions, bars fill their column.
No ml-auto secondary metric: Bundesland already leads the caption row, and a
member has no single seats/date-like number that earns the slot.

## Abstimmungen tab (default)

```
+------------------------------------------+
| STIMMVERHALTEN                           |  <- caption text-s caps fg@70
| [###JA###|#######NEIN#######|#|·]        |  <- fingerprint: stacked bar h-8,
| 12 JA · 38 NEIN · 3 ENTHALTEN ·          |     gap-[2px], segments = member's
| 4 NICHT ABGEGEBEN                        |     choices: success/danger/yellow/
|                                          |     fg@15; Tooltip per segment;
|                                          |     tap segment -> choice filter;
|                                          |     legend text-s, counts semibold
| v [Linie v] [Stimme v]                   |  <- FilterPillRow stays inline on
|                                          |     BOTH devices (detail page, not
| ------------------------------------------     a feed; no floating button)
| [ NEIN ]   Bundeswehreinsatz im Libanon  |  <- choice chip leads: solid,
|            (UNIFIL)                      |     white text on choice color,
|            25. JUN 2026 · ■ ANGENOMMEN   |     11px caps semibold; fixed
| ------------------------------------------     104px chip column
| [  JA  ]   Buergergeld Reform            |
|            22. MAI 2026 ·                |  <- title: font-display semibold
|            ABWEICHEND VON LINIE NEIN ·   |     text-l, wraps
|            ■ ANGENOMMEN                  |  <- defection: danger semibold
| ------------------------------------------     caption in the meta row
| [ENTHALTEN] Wehrpflicht Wiedereinfuehrung|  <- Enthalten chip: yellow bg,
|            08. MAI 2026 · ■ ANGENOMMEN   |     dark text (voteDetail rule)
| ------------------------------------------
| NICHT      Cannabis-Reform zweite Lesung |  <- absent: NO chip; plain caption
| ABGEGEBEN  02. MAI 2026 · ■ ABGELEHNT    |     text-s caps fg@40, wraps in
| ------------------------------------------     the chip column. Never "-".
+------------------------------------------+
```

- Row grid: `grid-cols-[104px_1fr]`, hairline fg@8 between rows, py-m, whole
  row links to `/votes/:id/`.
- Outcome = 6px square dot in success/danger + "ANGENOMMEN"/"ABGELEHNT"
  text-s caps fg@70. The rotated Stamp leaves this list (banned on list
  surfaces); the abweichler Stamp likewise, replaced by the danger caption.
- Meta row order: date · (ABWEICHEND VON LINIE {JA|NEIN|ENTHALTEN}, danger
  semibold caption, only when `defected`) · outcome dot+word.
- Desktop: same grid, meta row stays under the title (rows are already short;
  a right-aligned meta column would misalign with 2-line titles).
- `defected === null` (no party line): no defection caption, row otherwise
  identical.

## Reden tab

```
+------------------------------------------+
| [ o| Reden durchsuchen................ ] |  <- search input unchanged
|                                          |
| ------------------------------------------
| BAfoeG-Reform: Bildung bezahlbar         |  <- group title: font-display
| machen                                v  |     semibold text-l; chevron
| 11. JUN 2026 · 6 BEITRAEGE · 2 KURZ ·    |  <- meta captions text-s caps
| ZUR ABSTIMMUNG ->                        |     fg@70; vote link keeps ext icon
| "Sehr geehrte Frau Praesidentin! Liebe   |  <- excerpt: Charter serif text-m
| Kolleginnen und Kollegen! Drei..."       |     fg@70, line-clamp-2
| ------------------------------------------
| Aktuelle Stunde: Mietenpolitik        ^  |  <- expanded group
| 22. MAI 2026 · 1 BEITRAG                 |
|                                          |
|   MAX BEISPIEL · (logo17)                |  <- timeline speaker: text-s caps
|   "...unmittelbar vorheriger Beitrag..." |     semibold when it's THIS member,
|                                          |     fg@70 otherwise; party logo 17
|   ERIKA MUSTERFRAU                       |     replaces the colored PartyBadge
|   "Frau Praesidentin! Werte Kollegen!    |  <- speech bodies: Charter serif
|   Vonovia ist der groesste private..."   |     text-m; member rows full
|                                          |     opacity, context rows fg@70
+------------------------------------------+
```

Grouping, search, expand/context-loading mechanics from memberSpeeches.mock.md
are untouched. Only the skin changes: display-serif titles, caption meta,
serif speech prose, logo instead of badge in the timeline.

## Antraege tab

```
+------------------------------------------+
| [ o| Antraege durchsuchen.............. ]|
| v [Stand v] [Abstimmung v] [Kategorie v] |  <- pills unchanged
|                                          |
| ------------------------------------------
| Kultur macht stark bis 2032              |  <- title: font-display semibold
| fortfuehren                              |     text-l, links to motion/vote
| [NICHT BERATEN]  11. JUN 2026 ·          |  <- status chip: STRAIGHT, outline
| 31 UNTERZEICHNER                         |     fg@70 for procedural states
| [Kultur]                                 |  <- topic chips unchanged (max 3)
| ------------------------------------------
| Pflegende Angehoerige mit Pflegelohn     |
| unterstuetzen                            |
| [■ ABGELEHNT 12. JUN]  09. MAI 2026 ·    |  <- decided via vote: dot+word in
| 23 UNTERZEICHNER                         |     success/danger + short date,
| ------------------------------------------     links to the vote (replaces
+------------------------------------------+     the rotated result Stamp)
```

- Rotated Stamps leave this list too. Procedural states (UEBERWIESEN, NICHT
  BERATEN, BESCHLUSSEMPFEHLUNG) = outlined chip, 11px caps, fg@70 border and
  text (neutral facts, no color). ABGELEHNT without vote = outlined chip in
  danger. Linked vote result = the same dot+word idiom as the votes tab.

## Filters / interactions

- Header: party logo -> party page; ABWEICHUNGEN sub-caption -> votes tab
  with `lineFilter=abw`; photo credit link unchanged.
- Votes tab: fingerprint segments toggle `choiceFilter` (tap active segment
  again to clear; non-matching segments dim to opacity-s, mirrors the
  voteDetail legend-toggle idiom). FilterPills Linie + Stimme keep their URL
  semantics; the Stimme option for absent reads "Nicht abgegeben", never "-".
  Row -> vote detail.
- Reden tab: search + group expand + timeline context loading unchanged.
- Antraege tab: search + three pills unchanged; title -> vote if linked,
  else motion page; vote chip -> vote.
- Detail pages keep inline pill rows on mobile; the floating filter button
  is a feed device (votes/members lists), not for tabs inside a detail page.

## What it emphasizes at a glance

Before reading a word you see the member's parliamentary fingerprint: the
choice bar and the rail of colored chips show how THEY vote (a wall of red
for an opposition leader, green for coalition, danger captions where they
broke ranks), while attendance and loyalty bars rank them the same way the
members grid does.

## Why (decisions)

- **Member's vote left and colored, outcome demoted** is audit finding 4
  verbatim: on the live page every row shouts the same rotated ANGENOMMEN
  while the member's NEIN is a small outline chip at the far right; the roles
  are exactly inverted. Rotated stamps are also banned on list surfaces.
- **Fingerprint bar over term ribbon + topic galaxy** (supersedes
  votingRecord.mock.md option 1): the topic galaxy is unimplementable, there
  is no `topic` on `MemberVoteRow` and none in the query behind it; the term
  ribbon's payoff ("when did she break?") is weak against WP21 data, where 57
  namentliche votes bunch onto ~12 sitting days and 95% of members have 0-2
  defections, so the ribbon renders as an unreadable barcode. The stacked
  choice bar is the established house idiom for metric breakdowns, doubles as
  the choice filter, and answers the better question "how does this person
  vote?"; defection timing survives via the ABW filter + danger captions with
  dates.
- **No mini-hemicycle / duel bar per row**: 57 repeated chamber vizzes are
  noise; the hemicycle stays a one-per-page device (vote card, vote detail).
  The dot+word outcome carries the same fact in 12px.
- **Poster numeral + bar over StatPies**: the task of the header is continuity
  with the MemberCard the user just tapped (same captions, same success bar,
  scaled up), and photo + two pie discs would be disc overload. StatPies
  remain the party-detail device.
- **Tab counts replace stat tiles**: Abstimmungen/Reden/Antraege tiles
  duplicated the tab bar one swipe away; a count in the tab label is the same
  information with zero extra rows.
- **PartyHistoryChart: nothing to do.** It is a partyDetail component; member
  detail renders no chart and gains none. Recharts stays off this page.

## Relation to older mocks

- Old memberDetail.mock.md (identity strip + 4 tiles + table rows): replaced.
- votingRecord.mock.md: options 1-3 retired (galaxy has no data, ribbon
  rejected above, waffle and topic groups with it); its row principle
  (choice-colored lead, outcome as faint trailing chip, ABW surfaced) is
  implemented here.
- memberSpeeches.mock.md: information architecture (grouped appearances,
  Beitraege, search across contributions) fully survives; skin per this mock.

## Implementation notes for frontend

- **No backend change.** Everything renders from the existing `MemberDetail`
  payload: absent count = `history.filter(choice === 'nicht_abgegeben')`,
  fingerprint counts from `history`, defection dates from `history[].date` +
  `defected`, party slug for the logo link via `PARTY_SLUG`.
- **Survives:** MemberDetailTabs (add count in label, fg@40), FilterPill/
  FilterPillRow, useMemberProposalFilters, groupMemberSpeeches /
  useMemberSpeeches / useSpeechSearch / useSpeechBody, MemberSpeechGroupRow
  mechanics, ProposalsTab search + pills, PartyLogo, `initials()`,
  lineFilter/choiceFilter route search params.
- **Restyled:** MemberPortrait (square 112/128, radius 0, credit line kept),
  VoteChoicePill -> solid chip (white text on choice color, yellow gets dark
  text; **shared with voteDetail/DefectorRow**, restyle once, check both
  surfaces), MemberSpeechGroupRow + ProposalRow skins per above.
- **Dies on this page:** StatTiles usage in MemberDetailShell (component
  itself survives, antragDetail + voteDetail import it), PartyBadge in the
  header and in the speech timeline (logo instead), MandateBadge (folds into
  the caption row as plain text), every `Stamp` import in VotingRecordTab and
  ProposalRow.
- **New:** MemberStatBar (caption + 32px poster numeral + 6px bar +
  sub-caption; two instances), ChoiceFingerprintBar (stacked h-8 bar +
  legend, controlled by choiceFilter). Both bespoke view code, no new shadcn
  primitives.
- **Absent chip column:** `grid-cols-[104px_1fr]`; "NICHT ABGEGEBEN" wraps to
  two caption lines inside the column, chips are w-fit. Verify EN "NOT CAST"
  / "ABSTAINED" fit; pick i18n strings accordingly.
- **i18n keys needed:** notCast ("Nicht abgegeben"/"Not cast"), missedOf
  ("{n} von {total} verpasst"), deviatedFromLine ("Abweichend von Linie {x}"),
  votingBehavior ("Stimmverhalten"), noPartyLine ("Keine Fraktionslinie"),
  signatories/status labels exist.
- **Prerender:** routes unchanged, nothing to add to `prerenderPaths()`.
  Child tabs already guard loader data.

## Tokens

| Element | Size / weight | Notes |
|---|---|---|
| Name | xxl font-display semibold | header h1 |
| Meta captions (state, mandate, age, job) | s caps regular fg@70, ls 0.08em | · separated |
| Poster stat numeral | 32px font-display semibold tabular-nums | plan-102 poster extension |
| Stat caption / sub-caption | s caps fg@70 | ABW link: danger semibold |
| Stat bar | h-[6px] | success fill, fg@15 track |
| Fingerprint bar | h-8, gap-[2px] | success/danger/yellow/fg@15, Tooltip per segment |
| Tab label | l regular (active semibold) | count fg@40 |
| Row title (all three tabs) | l font-display semibold | wraps, no clamp |
| Choice/status chip | 11px caps semibold | solid: white on color (yellow -> dark text); procedural: outline fg@70 |
| Absent label | s caps fg@40 | plain text, no chip |
| Outcome | 6px square dot success/danger + s caps fg@70 | |
| Defection caption | s caps semibold danger | in meta row |
| Speech/excerpt prose | m Charter serif | fg@70 clamped closed, full fg open |
| Row separators | hairline fg@8, py-m | no card chrome inside tabs |
| Photo | 112px mob / 128px desk, square, radius 0 | fallback initials xl semibold fg@40 on surface |
| Spacing | xs/s/m/l/xl only | header gap l, stats grid gap-l |

Colors: success/danger/yellow = ballot meaning, success = positive metrics,
fg opacity ladder for everything neutral, party color only in the logo.
Components: Tabs (existing nav), Input, FilterPill(Row), Tooltip, Skeleton
(load states); no new primitives. Radius 0 everywhere; no rotated stamps, no
left accent rails, no gray card backgrounds.

## Rejected alternatives (do not re-propose)

- Term ribbon + topic galaxy (votingRecord.mock.md option 1): no topic data,
  ribbon unreadable at WP21 vote density; retired above.
- Quarter waffle (option 2) and topic-grouped list (option 3): retired with it.
- Mini-hemicycle or duel bar per vote row: repeated-viz noise.
- StatPies in the header: party-detail device, disc overload next to a photo.
- Round portrait, colored PartyBadge in header, rotated Stamps in any tab list.
- Floating filter button on detail tabs: feed-only device.
