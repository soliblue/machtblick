# /parties

Route: `/parties`

Plan 114 parity contract. The iOS parties surface is the reference: seat map
first, then single-column party rows grouped by government and opposition. The
web keeps the same public URL and localized route variants.

## Mobile

```
+---------------------------------------------+
| Machtblick                               =  |
|                                             |
|              . . . . . . .                 |
|          ## ## ## .. .. .. %% %%           |
|       ## ## ## ## == == .. %% %% %%        |
|     ## ## ## ## ## == == .. %% %% %%       |
|                                             |
| REGIERUNG / 330 VON 630 SITZEN             |
| (o) CDU/CSU   210  | SITZE / 33%           |
|                   | Geschlossenheit   97%  |
|                   | [#############---]     |
|                   | Anwesenheit       92%  |
|                   | [############----]     |
| ------------------------------------------- |
| (o) SPD       120  | SITZE / 19%           |
|                   | Geschlossenheit   99%  |
|                   | [###############-]     |
|                   | Anwesenheit       94%  |
|                   | [#############---]     |
|                                             |
| OPPOSITION / 297 SITZE                     |
| (o) AfD       150  | SITZE / 24%           |
|                   | Geschlossenheit   96%  |
|                   | [##############--]     |
|                   | Anwesenheit       91%  |
|                   | [############----]     |
| ------------------------------------------- |
| Gruene                                     |
| 85                                         |
| ...                                        |
| ------------------------------------------- |
| Linke                                      |
| 62                                         |
| ...                                        |
|                                             |
| FRAKTIONSLOS / 3 SITZE ->                  |
+---------------------------------------------+
```

## Desktop

```
+----------------------------------------------------------------------+
| Machtblick        Abstimmungen  Abgeordnete  Fraktionen      Deutsch |
|                                                                      |
|                          . . . . . . .                               |
|                    ## ## ## .. .. .. %% %%                           |
|                ## ## ## ## == == .. %% %% %%                         |
|                                                                      |
| REGIERUNG / 330 VON 630 SITZEN                                       |
| (o) CDU/CSU   210  | Sitze / 33%                                    |
|                   | Geschlossenheit [################-------] 97%    |
|                   | Anwesenheit     [###############--------] 92%    |
| -------------------------------------------------------------------- |
| (o) SPD       120  | Sitze / 19%                                    |
|                   | Geschlossenheit [#################------] 99%    |
|                   | Anwesenheit     [################-------] 94%    |
|                                                                      |
| OPPOSITION / 297 SITZE                                               |
| (o) AfD       150  | Sitze / 24%                                    |
|                   | Geschlossenheit [################-------] 96%    |
|                   | Anwesenheit     [###############--------] 91%    |
| -------------------------------------------------------------------- |
| Gruene                                                  85           |
| ...                                                                  |
| -------------------------------------------------------------------- |
| Linke                                                   62           |
| ...                                                                  |
|                                                                      |
| FRAKTIONSLOS / 3 SITZE ->                                            |
+----------------------------------------------------------------------+
```

Desktop keeps a single-column row list. Multiple columns are not used here
because plan 114 names the row list as the party-list parity target.

## Filters / interactions

- No filters and no search. The full list fits as a structured directory.
- Seat map is informational. Party colors are identity only.
- Each party row has a fixed 120px identity column, a vertical rule, and a
  flexible statistics column. Party identity uses a 10px color dot, not a logo.
- Party row links to `/parties/:id/`.
- Fraktionslos row links to `/members/?party=fraktionslos`.
- English routes stay available through the existing localized URL scheme.

## What This Emphasizes

At a glance: coalition arithmetic first, then each party's size, cohesion, and
attendance in a row that reads like the iOS surface.

## Tokens

| Element | Size / weight | Spacing | Component |
|---|---|---|---|
| Seat map | none | mb-xl | existing Hemicycle |
| Group caption | s uppercase regular opacity-l | mb-m | none |
| Party row name | m semibold | gap-xs | 10px party color dot |
| Seat numeral | poster 32 display semibold tabular | mt-xs | none |
| Seat caption | s uppercase regular opacity-l | mt-xs | none |
| Stat caption | s uppercase regular opacity-l | mt-s | none |
| Stat bar | h-3px success fill on fg opacity-s | gap-s | none |
| Row divider | none | py-m | border fg opacity-s |
| Footnote row | s uppercase regular opacity-l | mt-l | ArrowRight icon s |

Colors: party color appears in the seat map and party identity dot only.
Positive metrics use success. Neutral counts and labels use foreground opacity.
No Card primitive and no Badge are required.
