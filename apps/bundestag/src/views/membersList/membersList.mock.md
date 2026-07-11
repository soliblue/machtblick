# /members

Plan 114 aligns the directory with the iOS member grid. The page is a compact
wall of portrait tiles, with search and filtering kept as web-native controls.

## Mobile

```text
+------------------------------------------+
| Machtblick      Abstimmungen Abgeordnete |
|                                          |
| [ o  Abgeordnete durchsuchen.......... ] |
| [Fraktion] [Land] [Geschlecht] [...]     |
|                                          |
| [summary statistics]                     |
| 630 PERSONEN                    [Sort]    |
|                                          |
| .----------. .----------. .----------.   |
| |      SPD | |      CDU | |    GRUENE|   |
| |          | |          | |          |   |
| | PORTRAIT | | PORTRAIT | | PORTRAIT |   |
| |          | |          | |          |   |
| | Erika    | | Max      | | Lena     |   |
| '----------' '----------' '----------'   |
| .----------. .----------. .----------.   |
| |    ...   | |    ...   | |    ...   |   |
+------------------------------------------+
```

- The content container is `max-w-3xl` with `px-l`.
- Tiles use a 3:4 portrait ratio, `rounded-m`, and `gap-s`.
- The mobile grid has three columns. The desktop grid has four columns.
- The portrait fills the tile. A bottom gradient keeps the overlaid name
  legible without turning the tile into a separate text card.
- The party mark sits directly in the top-right corner. No badge background,
  metrics, state label, or metadata competes with face recognition.
- Missing portraits use initials on `surface`.
- Search remains visible. Existing URL-backed filters, sort, statistics, and
  empty state remain available.

## Desktop

```text
| Machtblick      Abstimmungen  Abgeordnete  Fraktionen      [Deutsch] |
|                                                                      |
| [ o  Abgeordnete durchsuchen...................................... ] |
| [Fraktion] [Bundesland] [Geschlecht] [Alter] [Mandat]                |
|                                                                      |
| [summary statistics]                                                 |
| 630 PERSONEN                                                [Sort]    |
|                                                                      |
| .------------. .------------. .------------. .------------.          |
| |        SPD | |        CDU | |     GRUENE | |        AfD |          |
| |            | |            | |            | |            |          |
| |  PORTRAIT  | |  PORTRAIT  | |  PORTRAIT  | |  PORTRAIT  |          |
| |            | |            | |            | |            |          |
| | Erika      | | Max        | | Lena       | | Jonas      |          |
| '------------' '------------' '------------' '------------'          |
```

Desktop keeps the same tile anatomy and content order. It adds a fourth
column and a larger gap without widening beyond the app's primary list width.

## Interaction

- The whole tile links to `/members/:id/votes/`.
- The accessible label includes name, party, and state.
- The first visible portraits load eagerly. Remaining portraits load lazily.
- Hover may apply a restrained image scale and tile opacity transition.
- No full-height snapping is used on desktop or mobile.

## Tokens

| Element | Contract |
|---|---|
| Tile | 3:4, `rounded-m`, `surface`, overflow hidden |
| Name | s semibold mobile, m semibold desktop, two lines max |
| Party mark | 17px, top-right with `p-s` |
| Grid | 3 columns mobile, 4 columns from `sm`, gap s/m |
| Content width | `max-w-3xl` |

Party color appears only in the party mark. The portrait and name are the
primary scan signals.
