# /members

## Layout

```
+------------------------------------------------------------+
| Abgeordnete                                                |
|                                                            |
| [ Suche.......... ] [ Partei v ] [ Bundesland v ]          |
| [ Ausschuss v ]                                            |
|                                                            |
| Sortiert nach: [ Anwesenheit v ]                           |
|                                                            |
| +--------------------------------------------------------+ |
| | Name              Partei  Land     Anwes   Treue       | |
| +--------------------------------------------------------+ |
| | Erika Musterfrau  SPD     BE       98%     94%         | |
| | Max Beispiel      CDU     BY       96%     91%         | |
| | Lena Platzhalter  Gruene  HH       92%     97%         | |
| | Jonas Demo        FDP     NW       89%     82%         | |
| | ...                                                    | |
| +--------------------------------------------------------+ |
|                                                            |
|                       [ Mehr laden ]                       |
+------------------------------------------------------------+
```

## Notes

A scannable table beats cards here: filtering and sorting is the primary task. Anwesenheit and Treue are shown as percentages with the column itself acting as a sortable ratio. Party shown as Badge for color-scan. Row click navigates to `/members/:id`.

## Tokens

| Element | Text size | Weight | Spacing | Component |
|---|---|---|---|---|
| Page title | xxl | semibold | mb-l | — |
| Filter row | m | regular | gap-s, mb-s | Input, Select |
| Sort control | m | regular | mb-m | Select |
| Table header | s | semibold | py-s | Table |
| Table row | m | regular | py-s | Table |
| Party cell | s | semibold | — | Badge |
| Percent cell | m | regular | — | — |
| Load more | m | regular | mt-l | Button |

Components used: Input, Select, Table, Badge, Button.
