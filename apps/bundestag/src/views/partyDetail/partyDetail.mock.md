# /parties/:id

## Layout

```
+------------------------------------------------------------+
| < Zurueck zu Parteien                                      |
|                                                            |
| SPD                                                        |
| 206 Sitze  -  Regierung                                    |
|                                                            |
| +----------+ +----------+ +----------+                     |
| | Kohaesion| | Anwes.   | | Neben-   |                     |
| | 96%      | | 94%      | | eink.    |                     |
| |          | |          | | 4.200 E  |                     |
| +----------+ +----------+ +----------+                     |
|                                                            |
| [ Abstimmungen ] [ Mitglieder ] [ Profil ]                 |
| --------------                                             |
|                                                            |
| +--------------------------------------------------------+ |
| | Mietpreisbremse verlaengern   12.03.25                 | |
| | Kohaesion [############### 99% ]                       | |
| +--------------------------------------------------------+ |
| | Wehretat 2025                 08.03.25                 | |
| | Kohaesion [######### 78%  ]                            | |
| +--------------------------------------------------------+ |
| | Cannabis Reform               02.03.25                 | |
| | Kohaesion [################ 100% ]                     | |
| +--------------------------------------------------------+ |
| ...                                                        |
+------------------------------------------------------------+
```

## Notes

Identity strip, then three stat tiles (cohesion is the headline number). Tabs switch body. Default tab "Abstimmungen" lists recent votes with a per-vote cohesion bar so a viewer can spot the votes where the party broke apart. Low-cohesion bars use `danger` accent to surface the story.

## Tokens

| Element | Text size | Weight | Spacing | Component |
|---|---|---|---|---|
| Back link | s | regular | mb-m | Button (ghost) |
| Party name | xxl | semibold | — | — |
| Party meta | m | regular | mb-l | — |
| Stat tile | — | — | p-m, gap-xs | Card |
| Stat label | s | regular | — | — |
| Stat value | xl | semibold | — | — |
| Tabs | m | regular | mb-m, mt-l | Tabs |
| Vote row | — | — | p-m, mb-s | Card |
| Vote title | m | semibold | — | — |
| Vote date | s | regular | — | — |
| Cohesion bar | s | regular | mt-s | — |

Components used: Button, Card, Tabs.
