# /votes

## Layout

```
+------------------------------------------------------------+
| Abstimmungen                                               |
|                                                            |
| [ Suche.................................................. ] |
|                                                            |
| [ Typ v ] [ Antragsteller v ] [ Ergebnis v ]                |
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

Each row is a clickable card linking to `/votes/:id`. The result bar is the at-a-glance signal: width proportional to Ja / Nein / Enthaltung, colored by `success` / `danger` / neutral. Filters narrow the list in place. Proposer is shown as a party badge so the eye can scan by color. Rows use `py-xl` so dividers have more breathing room, with the first row reduced to `pt-xs` because it has no top divider. Dividers render as a rounded `1.5px` `elevated` rule. Stamp rows reserve bottom space for rotated outlines.

## Tokens

| Element | Text size | Weight | Spacing | Component |
|---|---|---|---|---|
| Page title | xxl | semibold | mb-l | n/a |
| Search row | m | regular | mb-m | Input |
| Filter row | m | regular | gap-s, mb-l | FilterPill |
| Row card | n/a | n/a | py-xl, first:pt-xs, gap-s | Card |
| Row divider | n/a | n/a | h 1.5px, inset-x-xs | n/a |
| Vote title | l | semibold | n/a | n/a |
| Party badge | s | semibold | n/a | Badge |
| Date | s | regular | n/a | n/a |
| Stamp row | s | semibold | gap-s, pb-xs | n/a |
| Result bar | s | regular | mt-s | n/a |
| Load more | m | regular | mt-l | Button |

Components used: Input, FilterPill, Card, Badge, Button.
