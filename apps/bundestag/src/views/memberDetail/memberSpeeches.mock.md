# Member speeches tab

Route: `/members/$id/speeches`

## Layout

```
+------------------------------------------------------------+
| [Search Reden]                         14 Reden, 37 Beitr. |
|                                                            |
| 08.05.2026  Bundesweites Moratorium des Windindustrie... AfD v |
| 6 Beitraege  3 kurz                                         |
| Herr Praesident! Werte Kollegen! Also eines ist in der...   |
|                                                            |
| 26.03.2026  Aktuelle Stunde: Mitversicherung von... AfD   v |
| 1 Beitrag                                                   |
| Danke schoen, Frau Moll; dann lernen wir uns so auch...     |
|                                                            |
| 19.03.2026  Tagesordnungspunkt 20  AfD                    ^ |
| 2 Beitraege  1 kurz                                         |
|                                                            |
| Verlauf                                                     |
|   Sprecherin A  SPD                                         |
|   ... unmittelbarer vorheriger Beitrag ...                  |
|                                                            |
|   Carolin Bachmann  AfD                                     |
|   Frau Praesidentin! Werte Kollegen! Ich wende mich...      |
|                                                            |
|   Carolin Bachmann  AfD                                     |
|   Setzen Sie mit uns die Enquete-Kommission ein. Danke.     |
+------------------------------------------------------------+
```

## Intent

The tab is still named `Reden`, but the count and list unit are debate appearances, grouped by date and agenda item. Raw XML speaker fragments stay available inside the expanded group as `Beitraege`.

Short replies never stand alone in the list. They appear only inside the group timeline, next to nearby context rows when metadata is loaded.

Search matches every underlying contribution, including short replies. Results still return grouped rows so the count and navigation stay stable.

## Tokens

| Element | Text size | Weight | Spacing |
|---|---|---|---|
| Search input | m | regular | py-xs |
| Summary count | s | regular | gap-m |
| Group date | m | semibold | gap-s |
| Group title | m | regular | gap-s |
| Contribution count | s | regular | mt-xs |
| Excerpt | m | regular | mt-s |
| Expanded timeline | m | regular | pl-m |
