# /members/:id — Anfragen tab

## Layout

```
[ Abstimmungen ] [ Reden ] [ Anfragen ] [ Nebeneinkuenfte ] [ Bio ]
                          ----------

  ANFRAGEN GESAMT                              GROUPED BY  [Thema] [Datum]
  +-----------------------------------------------------+
  | 47 Kleine | 3 Grosse | 112 Schriftliche             |
  | [#################----] 162 Anfragen, WP21          |
  +-----------------------------------------------------+

  Y Filter   [ Typ v ]   [ Status v ]   [ Ressort v ]   [ Suche ]

  --------------------------------------------------------------
  VERTEIDIGUNG                                          18
  --------------------------------------------------------------
  | KL  12.03.25  Drohneneinsaetze in der Ostsee              |
  |               BMVg . Beantwortet . +14 Mitzeichner        |
  +-----------------------------------------------------------+
  | SF  08.03.25  Lieferung von Ersatzteilen fuer Marder       |
  |               BMVg . Beantwortet                          |
  +-----------------------------------------------------------+
  | GR  02.03.25  Strategische Ausrichtung Bundeswehr 2030    |
  |               BMVg . Noch nicht beantwortet . +62 Mitz.   |
  +-----------------------------------------------------------+
  | KL  27.02.25  Personalmangel in der Truppe                |
  |               BMVg . Beantwortet . +9 Mitzeichner         |
  +-----------------------------------------------------------+
  ...

  --------------------------------------------------------------
  GESUNDHEIT                                            11
  --------------------------------------------------------------
  | KL  10.03.25  Versorgungsluecken bei Kinderaerzten         |
  |               BMG . Beantwortet . +7 Mitzeichner          |
  +-----------------------------------------------------------+
  | SF  04.03.25  Apothekenreform - Auswirkungen laendl. Raum  |
  |               BMG . Noch nicht beantwortet                |
  +-----------------------------------------------------------+
  ...

  --------------------------------------------------------------
  STAAT UND VERWALTUNG                                  6
  --------------------------------------------------------------
  ...
```

### Badge legend (inline, top right of section)

```
KL = Kleine Anfrage   GR = Grosse Anfrage   SF = Schriftliche Frage
```

### Empty state

```
  +-----------------------------------------------------+
  |                                                     |
  |           Keine Anfragen in WP21                    |
  |                                                     |
  |   Diese Abgeordnete hat bisher keine Anfragen       |
  |   mitgezeichnet.                                    |
  |                                                     |
  +-----------------------------------------------------+
```

## Interactions

- Toggle group: `Thema` (default) vs `Datum`. Thema groups by `sachgebiet`, sorted by group size desc; within a group, newest first. Datum collapses groups into a flat reverse-chron list.
- FilterPill `Typ`: kleine / grosse / schriftlich
- FilterPill `Status`: beantwortet / offen
- FilterPill `Ressort`: top 8 responding ministries derived from the result set
- Row click opens the question PDF (and answer PDF if present) in a new tab — no dedicated detail page in this iteration.

## Notes (hierarchy, empty state, what the user does)

- **Hierarchy decision:** group by `sachgebiet` by default. Volume per MP is high (hundreds), and the story the user wants is "what does this MP actually care about". Date sort exists but is secondary.
- **Type lives in a 2-char badge, not a column** — keeps each row to two visual lines, leaves title room to breathe.
- **Co-signers shown as `+N Mitzeichner`** only when N > 0. Schriftliche Frage rows therefore omit the noise entirely (1 asker, no co-signers, no Mitzeichner suffix).
- **Status uses fg/success/danger semantics**, never party color: `Beantwortet` in `success`, `Noch nicht beantwortet` in `danger @ opacity-m`.
- **Empty state** for MPs with zero Anfragen (common for ministers, parl. state secretaries) reads as informational, not as an error.

## Tokens

| Element | Text size | Weight | Spacing | Component |
|---|---|---|---|---|
| Summary headline (counts) | m | regular | mb-l | Card |
| Group-by toggle | s | regular | gap-xs | Tabs (segmented) |
| Filter row | s | regular | gap-s, mb-m | FilterPill |
| Section caption (sachgebiet) | s uppercase, letter-spacing 0.08em | regular, opacity-l | mt-l, mb-s | — |
| Section count (right side) | s | semibold | — | — |
| Row container | — | — | py-s, gap-m | Card (sharp) |
| Type badge (KL/GR/SF) | s | semibold | — | Badge |
| Date | s | regular, opacity-m | — | — |
| Title | m | semibold | — | — |
| Meta line (Ressort . Status . Mitz.) | s | regular, opacity-l | — | — |
| Status (Beantwortet/Offen) | s | semibold | — | Badge or inline span w/ success/danger |
| Empty state | m | regular | p-xl | Card |

Filter row begins with `<Filter size={14} className="opacity-l" />` per house convention.

Components used: Tabs, FilterPill (custom), Badge, Card, Tooltip (on type badge legend).
