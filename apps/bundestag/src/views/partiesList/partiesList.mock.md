# /parties

Round-13 rehaul (plan 105) to the plan-102 card language. Supersedes the old
hairline-row list entirely.

Scan signal: **coalition arithmetic**. The hemicycle shows the chamber's
proportions; below it the parties are physically grouped under REGIERUNG /
OPPOSITION captions that carry the seat sums, so the majority math (330 vs
297) is read from the page structure before any card is read. Inside each
card, the poster seat numeral ranks size and the two success bars rank
discipline and presence.

## Layout, mobile (< 700px, 390 primary)

```
+------------------------------------------+
| Machtblick (app nav, sticky)          =  |
|                                          |
|              . · * ° * · .               |
|           .*%%%%:::::::####*.            |  <- hemicycle unchanged: 630 seat
|          :%%%%%%::===::######:           |     rects, PARTY_COLOR fill,
|         :%%%%%%%::===::#######:          |     seating order left->right.
|        .%%%%%%%%.:=:·:=:.#######.        |     Party color = identity, the
|                                          |     one sanctioned use. No legend:
|                                          |     the cards below are the legend.
| REGIERUNG · 330 VON 630 SITZEN           |  <- group caption: text-s caps
| .------------------..------------------. |     fg@70, ls 0.08em; seat sum
| | (logo20) CDU/CSU || (logo20) SPD     | |     computed from the group
| |                  ||                  | |
| | 210              || 120              | |  <- poster numeral: 32px
| | SITZE · 33 %     || SITZE · 19 %     | |     font-display semibold
| |                  ||                  | |     tabular-nums; sub-caption
| | GESCHLOSSENHEIT  || GESCHLOSSENHEIT  | |     s caps fg@70
| | [##########--] 97%| [############] 99%|
| | ANWESENHEIT      || ANWESENHEIT      | |  <- stat block: caption line,
| | [#########---] 92%| [##########--] 94%|     then 3px success bar +
| '------------------''------------------' |     s semibold tabular value
|                                          |     (restacked MemberCard idiom)
| OPPOSITION · 297 SITZE                   |
| .------------------..------------------. |
| | (logo20) AfD     || (logo20) Grüne   | |
| | 150              || 85               | |
| | SITZE · 24 %     || SITZE · 13 %     | |
| | ...              || ...              | |
| '------------------''------------------' |
| .------------------.                     |
| | (logo20) Linke   |                     |
| | 62               |                     |
| | SITZE · 10 %     |                     |
| | ...              |                     |
| '------------------'                     |
|                                          |
| FRAKTIONSLOS · 3 SITZE ->                |  <- footnote row, not a card:
|                                          |     text-s caps fg@70, links to
+------------------------------------------+     /members/?party=fraktionslos
```

- Grid: `grid-cols-2 gap-s` inside each group, page padding l, normal scroll.
  Six parties are a directory of six, not a feed: no snap, no floating filter
  pill (there is nothing to filter), no search.
- No masthead, no visible h1 (sr-only stays).
- Hemicycle sits directly under the app nav, full content width, mb-l.

## Layout, desktop (>= 700px, container stays max-w-3xl)

```
| Machtblick   Abstimmungen  Abgeordnete  Reden  Fraktionen      [Deutsch] |
|                                                                          |
|                          . · * ° * · .                                   |
|                      .*%%%%::::::::####*.                                |
|                     :%%%%%%:::===:::#####:        (hemicycle, max ~720)  |
|                    :%%%%%%%:::===:::######:                              |
|                                                                          |
| REGIERUNG · 330 VON 630 SITZEN                                           |
| .--------------------------------..--------------------------------.    |
| | (logo20) CDU/CSU               || (logo20) SPD                   |    |
| | 210  SITZE · 33 %              || 120  SITZE · 19 %              |    |
| | GESCHLOSSENHEIT [########--] 97%|| GESCHLOSSENHEIT [##########] 99%|  |
| | ANWESENHEIT     [#######---] 92%|| ANWESENHEIT     [########--] 94%|  |
| '--------------------------------''--------------------------------'    |
|                                                                          |
| OPPOSITION · 297 SITZE                                                   |
| .--------------------..--------------------..--------------------.      |
| | (logo20) AfD       || (logo20) Grüne     || (logo20) Linke     |      |
| | 150  SITZE · 24 %  || 85   SITZE · 13 %  || 62   SITZE · 10 %  |      |
| | ...                || ...                || ...                |      |
| '--------------------''--------------------''--------------------'      |
|                                                                          |
| FRAKTIONSLOS · 3 SITZE ->                                                |
```

- Same PartyCard reflowed: Regierung group `grid-cols-2 gap-m`, Opposition
  group `grid-cols-3 gap-m` (group size decides the column count; cards are
  identical). Desktop cards may place numeral + sub-caption on one line
  (`flex items-baseline gap-s`) since width allows; mobile stacks them.

## PartyCard anatomy

```
.----------------------.
| (logo 20)  CDU/CSU   |   logo: PartyLogo 20, decorative; name text-m
|                      |   semibold (logos are wordmarks, but the name
| 210                  |   stays for a11y + fraktionslose Klarheit)
| SITZE · 33 %         |   numeral: 32px font-display semibold tabular;
|                      |   sub-caption: s caps fg@70, share of 630
| GESCHLOSSENHEIT      |
| [#############-] 97% |   caption s caps fg@70; bar h-[3px], fill
| ANWESENHEIT          |   `--color-success` on fg@15 track; value
| [############--] 92% |   s semibold tabular fg
'----------------------'
```

- Card = card language: white `background`, 1px fg@15 border + soft double
  shadow, **radius 0**, padding m (desk p-l). No verdict chip, no colored
  top edge: Regierung/Opposition is encoded by the grouping, and the 3px
  edge stays a vote-outcome device.
- Whole card is one stretched link to `/parties/:slug/profile/`, aria-label
  = name, seats, Regierung/Opposition, Geschlossenheit, Anwesenheit.
- No party color anywhere on the card except the logo. Both bars are
  success (positive metrics); everything else fg-opacity ladder.

## Filters / interactions

- None. No search, no pills, no floating button: five Fraktionen fit one
  screen.
- Card -> party detail (profile tab). Hover: opacity easing, existing idiom.
- FRAKTIONSLOS footnote -> `/members/?party=fraktionslos` (there is no
  fraktionslos detail page; the three independents are people, not a party).

## What this emphasizes at a glance

Who holds the majority and by how much: the hemicycle shows the proportion,
the two group captions state the arithmetic, and the green bars rank every
Fraktion's discipline before a single number is read.

## Why (decisions)

- **Grouping over badges:** the old Regierung/Opposition Badge repeated the
  same word five times and encoded nothing visually. Grouping is structural:
  the coalition reads as one block with one seat sum, and the majority
  question (330 > 316?) is answerable from two captions.
- **Poster seat numeral:** seats are the party's weight in every vote; the
  32px numeral makes card size ranking instant, mirroring the hemicycle
  wedge above it.
- **Both bars on the card** (unlike MemberCard's single bar): with six cards
  there is no density problem, and cohesion is the page's core promise
  (spot the party that breaks ranks). The payload already carries both.
- **No chip on the top edge:** success/danger top edges mean angenommen/
  abgelehnt everywhere else; painting Opposition danger would be color as
  judgment, not meaning.

## Implementation notes for frontend

- **No backend change.** `PartyListItem` (`src/server/parties.ts`) already
  carries slug, party, seats, cohesion, attendance. Groups via
  `isGoverning` / `hasPartyLine` from `lib/parties`; seat sums + share
  percentages computed client-side (denominator = sum of all seats).
- **Dies:** `PartyRow.tsx` (and with it this view's Badge import).
- **New:** `PartyCard.tsx` (one file, whole card, MemberCard as the
  reference implementation for the stat block).
- **Survives untouched:** `Hemicycle.tsx`, `PartiesList.tsx` shell (gains
  the two grouped grids + footnote).
- **i18n:** keys needed: group caption "{sum} von {total} Sitzen" /
  "{sum} of {total} seats" (reuse pattern of missedOf if present),
  fraktionslos label exists; government/opposition/seats/cohesion/
  attendance exist.
- **Prerender:** same `/parties/` route, nothing to add.

## Tokens

| Element | Size / weight | Notes |
|---|---|---|
| Group caption | s caps regular fg@70, ls 0.08em | seat sum tabular |
| Card name | m semibold | one line, truncate |
| Seat numeral | 32px font-display semibold tabular-nums | poster extension |
| Seat sub-caption | s caps fg@70 | SITZE · share % |
| Stat captions | s caps regular fg@70 | caption utility |
| Stat bars | h-[3px] | success fill, fg@15 track |
| Stat values | s semibold tabular fg | |
| Card | white bg, 1px fg@15 border, double shadow, radius 0 | p-m mobile / p-l desk |
| Grids | gap-s mobile / gap-m desk | Regierung 2-col, Opposition 2-col mob / 3-col desk |
| Footnote row | s caps fg@70 | link, lucide ArrowRight size s |
| Container | max-w-3xl, p-l | unchanged |

Colors: party color in logos + hemicycle only; success bars; fg ladder for
all text. Components: PartyLogo; everything else bespoke view code. No
Badge, no Card primitive needed.

## Rejected alternatives (do not re-propose)

- Regierung/Opposition as verdict chip on the card's top edge: success/
  danger top edges are vote-outcome semantics.
- Party color as card accent, border, or bar fill: identity is logo-only.
- Snap feed or floating filter pill: six items, nothing to page or filter.
- Keeping the flat hairline rows with a Badge: the first obvious design,
  encodes nothing the payload knows (cohesion/attendance were dropped on
  the floor).
