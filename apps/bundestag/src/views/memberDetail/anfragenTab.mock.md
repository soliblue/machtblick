# /members/:id — Anfragen tab

## Layout

```
[ Abstimmungen ] [ Reden ] [ Anfragen ] [ Nebeneinkuenfte ] [ Bio ]
                          ----------

  [ Suche....................................................... ]

  [ Typ v ]   [ Status v ]   [ Ressort v ]

  ANFRAGE                                  DATUM     TYP   STATUS
  --------------------------------------------------------------
  Drohneneinsaetze in der Ostsee           12.03.25  KL    Beantwortet
  BMVg . +14 Mitzeichner
  --------------------------------------------------------------
  Lieferung von Ersatzteilen fuer Marder   08.03.25  SF    Beantwortet
  BMVg
  --------------------------------------------------------------
  Strategische Ausrichtung Bundeswehr 2030 02.03.25  GR    Offen
  BMVg . +62 Mitzeichner
  --------------------------------------------------------------
  ...
```

### Badge legend

```
KL = Kleine Anfrage   GR = Grosse Anfrage   SF = Schriftliche Frage
```

### Empty state

```
  +-----------------------------------------------------+
  |           Keine Anfragen in WP21                    |
  |   Diese Abgeordnete hat bisher keine Anfragen       |
  |   mitgezeichnet.                                    |
  +-----------------------------------------------------+
```

## Interactions

- Flat list, reverse-chron from server (`data.flat`).
- FilterPill `Typ`: kleine / grosse / schriftlich
- FilterPill `Status`: beantwortet / offen
- FilterPill `Ressort`: top 8 responding ministries derived from the result set
- Search input filters by title (substring, case-insensitive)
- Row click opens the question PDF (and answer PDF if present) in a new tab.

## Notes

- **Type is its own column** (KL/GR/SF badge, w-16) so headers align cleanly with VotingRecordTab.
- **Status column** shows `Beantwortet` (success) or `Offen` (danger), w-24.
- **Co-signers shown as `+N Mitzeichner`** only when N > 0. Schriftliche Frage rows therefore typically omit it.
- **Empty state** for MPs with zero Anfragen reads as informational, not an error.

## Tokens

| Element | Text size | Weight | Spacing |
|---|---|---|---|
| Search row | m | regular | mb-m |
| Filter row | m | regular | gap-s, mb-m |
| Header row | s uppercase, letter-spacing 0.08em | regular, opacity-l | py-s, gap-m |
| Row container | — | — | py-s, gap-m |
| Title | m | semibold | — |
| Meta line (Ressort . Mitz.) | s | regular, opacity-l | — |
| Date | s | regular, opacity-l | w-24 |
| Type badge (KL/GR/SF) | s | semibold | w-16 |
| Status (Beantwortet/Offen) | s | semibold, success/danger | w-24 |
| Empty state | m | regular | p-xl |
