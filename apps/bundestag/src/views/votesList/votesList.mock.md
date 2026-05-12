# /votes

## Layout

```
+------------------------------------------------------------+
| Abstimmungen                                               |
|                                                            |
| [ Suche.............. ] [ Antragsteller v ] [ Datum v ]    |
|                                                            |
| +--------------------------------------------------------+ |
| | Mietpreisbremse verlaengern        SPD    12.03.2025   | |
| | [######### Ja 412 | Nein 198 | Enth 24 ##############] | |
| +--------------------------------------------------------+ |
| | Wehretat 2025                      CDU    08.03.2025   | |
| | [############# Ja 510 | Nein 102 | Enth 18 ##########] | |
| +--------------------------------------------------------+ |
| | Cannabis Reform                    Gruene 02.03.2025   | |
| | [###### Ja 332 | Nein 290 | Enth 12 ##################] | |
| +--------------------------------------------------------+ |
| | ...                                                    | |
| +--------------------------------------------------------+ |
|                                                            |
|                       [ Mehr laden ]                       |
+------------------------------------------------------------+
```

## Notes

Each row is a clickable card linking to `/votes/:id`. The result bar is the at-a-glance signal: width proportional to Ja / Nein / Enthaltung, colored by `success` / `danger` / neutral. Filters narrow the list in place. Proposer is shown as a party badge so the eye can scan by color.

## Tokens

| Element | Text size | Weight | Spacing | Component |
|---|---|---|---|---|
| Page title | xxl | semibold | mb-l | — |
| Filter row | m | regular | gap-s, mb-l | Input, Select |
| Row card | — | — | p-m, gap-s, mb-s | Card |
| Vote title | l | semibold | — | — |
| Party badge | s | semibold | — | Badge |
| Date | s | regular | — | — |
| Result bar | s | regular | mt-s | — |
| Load more | m | regular | mt-l | Button |

Components used: Input, Select, Card, Badge, Button.
