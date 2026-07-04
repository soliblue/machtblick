# /votes/:id (Ergebnis + Reden tabs, card-language rehaul)

Round 2 of plan 105. Scope: the Ergebnis tab (result viz, per-party breakdown, Abweichler)
and the Reden tab summary section. Page header, Details tab, and SponsorStrip stay as they are
(SponsorStrip has its own mock).

## Ergebnis tab, mobile (390)

```
+---------------------------------------------+
|  [ Ergebnis ]   [ Details ]   [ Reden ]     |
+---------------------------------------------+
|                                             |
|  ERGEBNIS                                   |  caption: text-s uppercase opacity-l
|                                             |
|              . o o o o o o .                |
|          o o o o o o o o o o o o            |  HEMICYCLE, one dot = one seat
|       o o o o o o o o o o o o o o o         |  Ja (success) fills from left,
|     o o o o o o o o + + . . x x x x x       |  Enthaltung (fg@40) + Abwesend
|    o o o o o o o o + + . . x x x x x x      |  (fg@15) in the middle,
|   o o o o o o o o o + + . . x x x x x x     |  Nein (danger) from the right.
|                                             |  ~full content width, dots r=3
|   JA          53 ENTHALTUNG          NEIN   |
|   318         34 ABWESEND            225    |
|  (green)      (two text-s lines)     (red)  |
|                                             |
|   ^ every legend block is a filter toggle   |
|                                             |
|  FRAKTIONEN                                 |
|                                             |
|   (( ◕ ))     (( ◕ ))     (( ◑ ))           |  VoteDistributionDonut size 72,
|   [CDUCSU]     [SPD]      [LINKE]           |  one per Fraktion, sorted
|   Ja 189      Ja 120      Enth 44           |  Ja-share -> Nein-share,
|   Nein 5      Abw 8       Nein 14           |  3-col grid, 2 rows
|                                             |
|   (( ◔ ))     (( ◌ ))                       |
|   [GRUENE]     [AfD]                        |
|   Nein 71     Nein 149                      |
|   Ja 3        Abw 3                         |
|                                             |
|  ABWEICHUNGEN                               |
|                                             |
|  [CDU/CSU-Logo]  Linie JA · 9 von 197 ----  |  party group header:
|                                             |  logo 20 + line chip + count,
|  (foto) Max Mustermann          [ NEIN ]    |  hairline under
|  (foto) Erika Musterfrau   [ ENTHALTEN ]    |
|  ( MM ) Moritz Muster           [ NEIN ]    |  member rows: photo 36,
|  (foto) Paula Probe             [ NEIN ]    |  name text-m, deviating choice
|                                             |  as colored chip right-aligned
|  [SPD-Logo]      Linie JA · 2 von 120 ----  |
|                                             |
|  (foto) Sabine Beispiel         [ NEIN ]    |
|  (foto) Bernd Beispiel     [ ENTHALTEN ]    |
|                                             |
|  Quelle: offizielle Daten des Deutschen     |  text-s opacity-l, moved from
|  Bundestages ↗                              |  gray top box to plain footnote
+---------------------------------------------+
```

## Ergebnis tab, desktop (max-w-3xl, same component reflowed)

```
+----------------------------------------------------------------------+
|  [ Ergebnis ]        [ Details ]        [ Reden ]                    |
+----------------------------------------------------------------------+
|                                                                      |
|  ERGEBNIS                                                            |
|                                                                      |
|                        . o o o o o o o o .                           |
|                  o o o o o o o o o o o o o o o o                     |
|              o o o o o o o o o o o o o o o o o o o o                 |
|           o o o o o o o o o + + + . . . x x x x x x x x              |
|          o o o o o o o o o o + + + . . . x x x x x x x x x           |
|                                                                      |
|          JA              53 ENTHALTUNG                NEIN           |
|          318             34 ABWESEND                  225            |
|                                                                      |
|            hemicycle centered, max-w ~440px, dots r=3                |
|            poster numerals 40px font-display tabular-nums            |
|                                                                      |
|  FRAKTIONEN                                                          |
|                                                                      |
|   (( ◕ ))     (( ◕ ))     (( ◑ ))     (( ◔ ))     (( ◌ ))            |
|   [CDUCSU]     [SPD]      [LINKE]     [GRUENE]     [AfD]             |
|   Ja 189      Ja 120      Enth 44    Nein 71     Nein 149            |
|   Nein 5      Abw 8       Nein 14    Ja 3        Abw 3               |
|                                                                      |
|      one row, justify-between, same donut size 72                    |
|                                                                      |
|  ABWEICHUNGEN                                                        |
|                                                                      |
|  [CDU/CSU-Logo]   Linie JA · 9 von 197 ----------------------------  |
|                                                                      |
|  (foto) Max Mustermann      [ NEIN ]   (foto) Paula Probe  [ NEIN ]  |
|  (foto) Erika Musterfrau [ENTHALTEN]   ( MM ) M. Muster    [ NEIN ]  |
|                                                                      |
|      member rows reflow to a 2-col grid, groups stay stacked         |
|                                                                      |
|  Quelle: offizielle Daten des Deutschen Bundestages ↗                |
+----------------------------------------------------------------------+
```

## Reden tab, summary section (mobile shown; desktop identical, wider)

```
+---------------------------------------------+
|  DEBATTE IM UEBERBLICK                      |  caption
|  KI-Kurzfassungen auf Grundlage der         |  text-s opacity-l plain line,
|  tatsaechlichen Reden je Fraktion.          |  replaces the gray notice box
|                                             |
|  [CDU/CSU-Logo]        [ DAFUER ]        >  |  header: logo 20 left, stance
|  Die Fraktion stuetzt das Paket, betont     |  chip, chevron right
|  aber die Kosten fuer den Bund. Einzelne    |  prose: Charter serif, text-m,
|  Abgeordnete sehen die Finanzierung ...     |  line-clamp-3
|  ------------------------------------------ |  hairline fg@15
|  [SPD-Logo]            [ DAFUER ]        >  |
|  Die Fraktion sieht die Stabilisierung      |
|  als Kernversprechen und verweist auf ...   |
|  ------------------------------------------ |
|  [AfD-Logo]            [ DAGEGEN ]       >  |
|  Die Fraktion lehnt den Entwurf ab,         |
|  wuerde aber einzelne Teile mittragen ...   |
|  ------------------------------------------ |
|  [Linke-Logo]          [ ENTHALTEN ]     >  |
|  Die Fraktion enthaelt sich; ihr geht       |
|  die Stabilisierung nicht weit genug ...    |
|                                             |
|  REDEN ZUR ABSTIMMUNG                       |  unchanged below this line
|  [ (o) Reden durchsuchen................. ] |
|  ...                                        |
+---------------------------------------------+
```

## Interactions

- **Choice filter lives in the hemicycle legend.** The four legend blocks (JA numeral,
  NEIN numeral, ENTHALTUNG line, ABWESEND line) are toggle buttons (`aria-pressed`).
  Active filter dims all non-matching hemicycle dots to opacity-s and passes
  `selected` down to every Fraktion donut, which dims non-matching segments (existing
  `VoteDistributionDonut` behavior). Tap again to clear. The old `VoteCountsRow`
  swatch row is deleted; the legend is the counts row now.
- **Fraktion donut** links to the party page (`/parties/:slug/votes/`); hover shows a
  Tooltip with the full tally (Ja/Nein/Enthaltung/Abwesend). The per-member drill-down
  the waffle had moves entirely to the Abweichungen section, where the interesting
  members already are; rank-and-file members remain reachable via the party page.
- **Abweichler member row** links to `/members/:id/votes/` (unchanged). Group header
  logo links to the party page.
- **Debate summary row** (logo + chip + prose) is one button opening the existing
  `PartySummaryModal` (unchanged behavior).
- **Stance chip** derives from that party's ballot counts: yes > no → DAFUER (success),
  no > yes → DAGEGEN (danger), abstain plurality → ENTHALTEN (yellow, dark text),
  no clear line → GESPALTEN (outlined, fg, no fill).

## Why

One glance at the top of the Ergebnis tab should answer "how did parliament split,
and how close was it": the hemicycle shows the physical majority (dots past the
midline) the way the chamber itself would, while the old donut only offered the
meaningless total 630 in its hole. The waffle's 630 squares made every party row
look like noise; five donuts sorted Ja-to-Nein turn the party story into a single
readable gradient, and a mixed donut sticks out immediately. Grouping Abweichler
under one party header stops the logo stutter (9x CDU/CSU) and states the actual
story ("9 von 197 gegen die Linie JA") before any name is read. Serif prose plus a
stance chip turns the debate summaries from clamped UI text into content with a
verdict you can scan before reading.

## Implementation notes

- **Hemicycle**: reuse `votesList/VoteHemicycle`. Needs: a size variant (dot r≈3,
  numerals 40px vs the list's 32px), and interactive legend (either new
  `selected`/`onSelect` props, or a thin `ResultHemicycle` wrapper in voteDetail that
  renders the SVG via a shared seat helper and its own legend buttons). Dot dimming =
  opacity-s on non-matching fills, transition 120ms, same as the waffle had.
- **Fraktion donuts**: reuse `votesList/VoteDistributionDonut` (size 72,
  `selected` wired to the filter, no `showLabel`, hole too small). Sorting and
  mixed-detection logic already exist in `votesList/PartyDonutRow` /
  `deriveDek.lineParties`; reuse or extract, don't duplicate. Tally lines: top two
  non-zero choices, `text-s tabular-nums`, count value colored per choice
  (success/danger/yellow/fg@40), label fg opacity-l. Party logo via
  `votesList/PartyLogo` height 16, mixed party label semibold per house rule.
- **Abweichler**: keep `DefectorList`/`DefectorRow` files, restructure: iterate
  `defectors` groups (data already grouped `{party, majority, count, members[]}`),
  header = `PartyLogo` 20 + "Linie {JA}" mini-chip + "{count} von {members}" text-s
  opacity-l + hairline; rows keep photo/initials 36 and the existing
  `memberDetail/VoteChoicePill`, but chip moves right-aligned and the trailing party
  logo is deleted. Desktop 2-col via `grid desk:grid-cols-2`.
- **Debate summaries**: rework `PartySummaryPreviewList` rows: `PartyLogo` 20 +
  stance chip + ChevronRight header line, then `positionSummary` in Charter serif
  (`SERIF` const as in `VoteCard`) with `line-clamp-3`. Stance needs the per-party
  counts, which `data.partySummaries` already carries alongside the text fields; pass
  them through `DebateList`. Notice box → plain `text-s opacity-l` paragraph under
  the caption. `PartySummaryModal` untouched.
- **Deletions**: `PartyWaffle.tsx`, `VoteCountsRow.tsx`, the `bg-surface` source box
  (becomes the bottom footnote link).
- **No invented copy keys**: DAFUER/DAGEGEN/ENTHALTEN/GESPALTEN and "Linie"/"von"
  need i18n entries in both locales.

## Tokens

| Element | Text size | Weight | Spacing | Component |
|---|---|---|---|---|
| Section caption (ERGEBNIS, FRAKTIONEN, ABWEICHUNGEN, DEBATTE...) | s uppercase, ls 0.08em | regular, opacity-l | mb-s | — |
| Hemicycle poster numerals | 40px font-display tabular-nums | semibold | — | — |
| Legend labels (JA/NEIN/ENTHALTUNG/ABWESEND) | s uppercase, ls 0.08em | regular, opacity-l | gap-xs | button |
| Fraktion donut | — | — | grid gap-l, mb-l | VoteDistributionDonut 72 + Tooltip |
| Donut tally line | s tabular-nums | regular (value colored) | mt-xs | — |
| Party group header | s | semibold (chip), opacity-l (count) | pb-s + hairline, mt-l | PartyLogo 20 |
| Line chip / stance chip | 11px uppercase, ls 0.14em | semibold, white on choice color | px-s h-[20px] | — |
| Abweichler row | m (name) | regular | py-s, gap-m, hairline fg@8 | VoteChoicePill |
| Summary prose | m serif (Charter), leading 1.45 | regular | mt-s, line-clamp-3 | MarkdownInline |
| Summary divider | — | — | py-m rows | hairline fg@15 |
| Source footnote | s | regular, opacity-l | mt-xl | link underline |

Components used: Tooltip, existing PartyLogo / VoteDistributionDonut / VoteChoicePill /
PartySummaryModal. No new primitives. Radius 0 everywhere; chips are rectangles.
