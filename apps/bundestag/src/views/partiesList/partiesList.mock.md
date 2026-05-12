# /parties

## Layout

```
+------------------------------------------------------------+
| Parteien                                                   |
|                                                            |
| Sitzverteilung                                             |
| [SPD###|CDU/CSU########|Gruene###|FDP##|AfD####|Linke#|...]|
|                                                            |
| +--------------------------------------------------------+ |
| | SPD          206 Sitze       Regierung                 | |
| +--------------------------------------------------------+ |
| | CDU/CSU      197 Sitze       Opposition                | |
| +--------------------------------------------------------+ |
| | Gruene       118 Sitze       Regierung                 | |
| +--------------------------------------------------------+ |
| | FDP           92 Sitze       Regierung                 | |
| +--------------------------------------------------------+ |
| | AfD           83 Sitze       Opposition                | |
| +--------------------------------------------------------+ |
| | Linke         39 Sitze       Opposition                | |
| +--------------------------------------------------------+ |
+------------------------------------------------------------+
```

## Notes

The seat-distribution bar across the top is the at-a-glance image of the Bundestag: each segment width is proportional to seats, colored by party accent. Below, one row per party with seats and coalition status. Rows are clickable, navigating to `/parties/:id`. Coalition status uses `success` for Regierung, neutral for Opposition.

## Tokens

| Element | Text size | Weight | Spacing | Component |
|---|---|---|---|---|
| Page title | xxl | semibold | mb-l | — |
| Section label | l | semibold | mb-s | — |
| Seat bar | — | — | mb-l | — |
| Party row | — | — | p-m, mb-s | Card |
| Party name | l | semibold | — | — |
| Seat count | m | regular | — | — |
| Coalition badge | s | semibold | — | Badge |

Components used: Card, Badge.
