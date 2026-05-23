# /votes/:id

## Layout

```
+------------------------------------------------------------+
| < Zurueck zu Abstimmungen                                  |
|                                                            |
| Mietpreisbremse verlaengern                                |
| SPD  -  12.03.2025                                         |
|                                                            |
| +--------------------------------------------------------+ |
| | Worum geht es                                          | |
| | Kurzbeschreibung des Gesetzentwurfs in zwei oder drei  | |
| | Saetzen. Klartext, keine Juristensprache.              | |
| +--------------------------------------------------------+ |
|                                                            |
| Ergebnis: ANGENOMMEN                                       |
| Ja 412      Nein 198      Enth 24      Abw 32              |
| [######################| Ja ############################]  |
|                                                            |
| Wie die Fraktionen gestimmt haben                          |
| +-----------+ +-----------+ +-----------+ +-----------+    |
| | SPD       | | CDU/CSU   | | Gruene    | | FDP       |    |
| | Ja  201   | | Ja  152   | | Ja   58   | | Ja    1   |    |
| | Nein  2   | | Nein  44  | | Nein  0   | | Nein 88   |    |
| | Enth  0   | | Enth  1   | | Enth  0   | | Enth  3   |    |
| | [##### Ja] | [## Ja/Nei] | [#### Ja ] | [# Nein   ] |    |
| +-----------+ +-----------+ +-----------+ +-----------+    |
| +-----------+ +-----------+                                |
| | AfD       | | Linke     |                                |
| | ...       | | ...       |                                |
| +-----------+ +-----------+                                |
|                                                            |
| Abweichler                                                 |
| +--------------------------------------------------------+ |
| | 2 SPD gegen Linie  -  44 CDU/CSU gegen Linie  -  ...   | |
| | [ Namen anzeigen ]                                     | |
| +--------------------------------------------------------+ |
+------------------------------------------------------------+
```

## Notes

Title and proposer dominate the top. The "Worum geht es" block is the plain-language summary, set as a Card to feel distinct from metadata. Result is loud (badge + totals + single bar). The party-bloc grid is the centerpiece: each cell shows totals and a per-party result bar so cross-party deviations are visible at a glance. Abweichler callout makes defection a first-class story.

### Ergebnis tab waffle

The party waffle uses one 10 by 10 px square mark per member ballot, grouped by party and ordered by vote choice. It omits `Fraktionslos` because the section is a faction breakdown. Member-linked cells scale only to 125% on hover so the grid stays stable.

The result tab has two small section titles: `Ergebnis` above the donut and `Fraktionen` above the waffle. The waffle uses `max-content` for the party logo column and gives the cell column the remaining width. A subtle one-pixel `elevated` divider separates faction rows with tighter spacing than the votes list.

### Reden tab controls

```
[ Reden durchsuchen......................................... ]

[ Fraktion v ]
```

The speech search and speech filters use separate rows. Filter pills stay text-first, with party logos only for party values.

## Tokens

| Element | Text size | Weight | Spacing | Component |
|---|---|---|---|---|
| Back link | s | regular | mb-m | Button (ghost) |
| Vote title | xxl | semibold | — | — |
| Proposer + date | m | regular | mb-l | — |
| Summary card | m | regular | p-m, mb-l | Card |
| Summary heading | l | semibold | mb-s | — |
| Result label | l | semibold | — | Badge |
| Result totals | l | regular | gap-m | — |
| Result bar | s | regular | mt-s, mb-l | — |
| Result section title | s uppercase | regular, opacity-l | mb-s | — |
| Waffle label column | s | semibold | max-content | — |
| Waffle row divider | — | — | h-px, elevated | — |
| Waffle cell | — | — | 10px, gap 2px | — |
| Section heading | l | semibold | mb-m | — |
| Party cell | — | — | p-m, gap-s | Card |
| Party name | m | semibold | mb-s | — |
| Party tally | s | regular | — | — |
| Defectors card | m | regular | p-m, mt-l | Card |
| Show names | m | regular | mt-s | Button |

Components used: Button, Card, Badge.
