# /parties/:id

Route: `/parties/:id`

Plan 114 parity contract. Party detail becomes one continuous page matching the
iOS reference: header, demographics, proposals, alignment, donations, and
history. Visible profile, votes, and history tabs are removed. Existing nested
web URLs remain available through redirects or equivalent route handling.

## Mobile

```
+---------------------------------------------+
| Machtblick                               =  |
|                                             |
| (o) CDU/CSU                                |
| REGIERUNG / 210 SITZE / 33% DES BUNDESTAGS |
|                                             |
| GESCHLOSSENHEIT       ANWESENHEIT          |
| 97%                   92%                  |
| [################--]  [###############---] |
| 57 ABSTIMMUNGEN                            |
|                                             |
| ABGEORDNETE                                |
| (( gender ))        (( age ))              |
| GESCHLECHT          ALTER                  |
| ALLE 210 ABGEORDNETEN ->                   |
|                                             |
| ANTRAEGE                         12 / 43   |
| [##|%%|%%|##|%%|%%|##|%%|%%|%%|##|%%]     |
|                                             |
| UEBEREINSTIMMUNG                           |
| SPD      [########################----] 88% |
| Gruene   [###############-------------] 55% |
| Linke    [###########-----------------] 41% |
| AfD      [######----------------------] 22% |
|                                             |
| GROSSSPENDEN                 4 / 200.000 E |
| [############|######|####|##]              |
| Muster Holding GmbH             80.000 E   |
| 12. MRZ 2026                                |
| Beispiel Stiftung               60.000 E   |
| 04. FEB 2026                                |
|                                             |
| ANTEIL AM BUNDESTAG          2017 - heute  |
|       32% .                                 |
|          .                                  |
|    25% .       . 30%                        |
|       ' - - - '                             |
+---------------------------------------------+
```

## Desktop

```
+----------------------------------------------------------------------+
| Machtblick        Abstimmungen  Abgeordnete  Fraktionen      Deutsch |
|                                                                      |
| (o) CDU/CSU                        GESCHLOSSENHEIT    ANWESENHEIT    |
| REGIERUNG / 210 SITZE /            97%                92%            |
| 33% DES BUNDESTAGS                 [############--]   [########---] |
|                                    57 ABSTIMMUNGEN                   |
|                                                                      |
| ABGEORDNETE                                                          |
| (( gender ))                 (( age ))                               |
| GESCHLECHT                   ALTER                                   |
| ALLE 210 ABGEORDNETEN ->                                             |
|                                                                      |
| ANTRAEGE                                      12 / 43 ANGENOMMEN     |
| [##|%%|%%|##|%%|%%|##|%%|%%|%%|##|%%]                              |
|                                                                      |
| UEBEREINSTIMMUNG                                                     |
| SPD      [##################################------] 88%               |
| Gruene   [######################------------------] 55%               |
| Linke    [################------------------------] 41%               |
| AfD      [#########-------------------------------] 22%               |
|                                                                      |
| GROSSSPENDEN                                      4 / 200.000 E      |
| [########################|###########|######|###]                    |
| Muster Holding GmbH                                  80.000 E        |
| 12. MRZ 2026                                                          |
| Beispiel Stiftung                                    60.000 E        |
| 04. FEB 2026                                                          |
|                                                                      |
| ANTEIL AM BUNDESTAG                                  2017 - heute    |
| chart and event strip, same Verlauf visual language                  |
+----------------------------------------------------------------------+
```

Desktop may use wider rows and two-column sub-layouts only when the same content
order remains readable: demographics, proposals, alignment, donations, history.
The visible tab rail does not return.

## Removed From Primary Page

- Visible Profil, Abstimmungen, and Verlauf tabs.
- Embedded party vote list and party-line fingerprint. Existing nested vote
  URLs remain compatible but are not primary UI.
- Party success-rate block. Plan 114 moves it out of the primary party page.

## Filters / interactions

- Header seat count links to `/members/?party=:party`.
- Header identity uses the iOS 14px party-color dot, not the party logo.
- "Alle Abgeordneten" links to the same filtered member list.
- Proposal stacked bar opens a filtered vote feed for this party's proposals.
- Alignment rows link to the compared party and expose shared-vote counts with
  Tooltip.
- Donation segments expose donor details with Tooltip. Donor list is always
  visible below the bar.
- History chart retains the existing chart and event-strip interaction.
- Legacy `/parties/:id/profile/`, `/votes/`, and `/history/` URLs remain
  available through redirects or route handling.

## What This Emphasizes

At a glance: who the party is, how cohesive and present it is, what it proposed,
who it aligns with, who funds it, and how its Bundestag share changed over time.

## Tokens

| Element | Size / weight | Spacing | Component |
|---|---|---|---|
| Party name | xxl display semibold | gap-s | 14px party color dot |
| Meta caption | s uppercase regular opacity-l | mt-s | link for seats |
| Poster stat numeral | poster 32 display semibold tabular | gap-xs | stat bar |
| Stat bars | h-6px success fill on fg opacity-s | gap-l | none |
| Section captions | s uppercase regular opacity-l | mb-s | none |
| Demographic donuts | m center text, s caption | gap-m | PieDonut anatomy |
| Proposal bar | h-8, gap 2px | mb-xl | Tooltip per segment |
| Alignment rows | m semibold tabular values | py-s | PartyLogo, Tooltip |
| Alignment bars | h-3px success fill | gap-m | none |
| Donation bar | h-8, gap 2px | mb-m | Tooltip |
| Donor rows | m name, s uppercase date, m semibold amount | py-s | none |
| History chart | s labels opacity-l | mt-l | recharts exception |

Colors: party color only for the identity dot and history line or area. Positive
metrics use success. Proposal outcomes use success or danger. Donations are
neutral facts and use foreground opacity only. Radius follows the page-wide web
contract, with no decorative cards.
