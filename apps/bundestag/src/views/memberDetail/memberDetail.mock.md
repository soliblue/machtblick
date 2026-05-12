# /members/:id

## Layout

```
+------------------------------------------------------------+
| < Zurueck zu Abgeordnete                                   |
|                                                            |
| Erika Musterfrau                                           |
| SPD  -  Berlin  -  Direktmandat                            |
|                                                            |
| +----------+ +----------+ +----------+ +----------+        |
| | Anwes.   | | Treue    | | Reden    | | Neben-   |        |
| | 98%      | | 94%      | | 42       | | eink.    |        |
| |          | |          | |          | | 12.400 E |        |
| +----------+ +----------+ +----------+ +----------+        |
|                                                            |
| [ Abstimmungen ] [ Reden ] [ Nebeneinkuenfte ] [ Bio ]     |
| --------------                                             |
|                                                            |
| +--------------------------------------------------------+ |
| | Mietpreisbremse verlaengern   12.03.25   Ja   (Linie)  | |
| | Wehretat 2025                 08.03.25   Nein (Abw)    | |
| | Cannabis Reform               02.03.25   Ja   (Linie)  | |
| | ...                                                    | |
| +--------------------------------------------------------+ |
+------------------------------------------------------------+
```

## Notes

Identity strip at top, then four stat tiles (one number each, large). Tabs switch the body. Default tab "Abstimmungen" lists how this MP voted with a small marker showing whether it matched the party line (`Linie`) or broke from it (`Abw`). Abweichungen are the visual story here, so the Abw label uses `danger` accent.

## Tokens

| Element | Text size | Weight | Spacing | Component |
|---|---|---|---|---|
| Back link | s | regular | mb-m | Button (ghost) |
| MP name | xxl | semibold | — | — |
| MP meta | m | regular | mb-l | — |
| Stat tile | — | — | p-m, gap-xs | Card |
| Stat label | s | regular | — | — |
| Stat value | xl | semibold | — | — |
| Tabs | m | regular | mb-m, mt-l | Tabs |
| Vote row | m | regular | py-s | Table |
| Linie/Abw marker | s | semibold | — | Badge |

Components used: Button, Card, Tabs, Table, Badge.
