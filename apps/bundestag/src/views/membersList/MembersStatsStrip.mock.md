# /members — Stats strip

A small read-only viz row that sits between the filter pill row and the "N Personen" counter on the members list. Three tiles summarize the currently filtered set: `Geschlecht` (pie), `Alter` (horizontal bars), `Partei` (horizontal bars). The strip is a slave to the filters above it — it never collapses, never accepts clicks, never re-orders the table. Its only job is to make the shape of the current filter visible at a glance.

Page column is `max-w-3xl` (~768px). Strip lives between `MembersList.tsx` lines ~99 and ~100.

## Desktop layout (>= md, 768px)

Three tiles in a 3-column grid, all the same height. Heights and paddings called out at the bottom of the file.

```
+ - - - filter pill row above - - - - - - - - - - - - - - - - - - - - - - - +

+----------------------------+----------------------------+----------------------------+
| GESCHLECHT                 | ALTER                      | PARTEI                     |
|                            |                            |                            |
|         . - - - .          |  Unter 30   12 [##-----]   |  CDU/CSU 207 [##########] |
|        / . . . . \         |  30 bis 39  64 [######-]   |  SPD     120 [######----] |
|       . . . . . . .  348   |  40 bis 49  98 [########]  |  Grüne    85 [####------] |
|       . . . . . . . Männl. |  50 bis 59 152 [##########] AfD     76 [####------] |
|       . . . . . . .        |  60 bis 69 174 [##########] Linke    38 [##--------] |
|        \ . . . . /         |  70+        62 [######-]   |  Frakt.l.  4 [----------] |
|         ' - - - '          |                            |                            |
|                            |                            |                            |
|  M 348 (55%)  W 282 (45%)  |                            |                            |
+----------------------------+----------------------------+----------------------------+

+ - - - "N Personen" counter below - - - - - - - - - - - - - - - - - - - - - +
+ - - - sortable table headers - - - - - - - - - - - - - - - - - - - - - - - +
```

## Mobile layout (< md)

Two tiles side by side. The `Partei` tile is hidden (`hidden md:block`). Reasoning: the table below already shows the party column with badges, and squeezing 5-6 party bars into a sub-300px tile collapses the visual differences below noise.

```
+-----------------------+-----------------------+
| GESCHLECHT            | ALTER                 |
|                       |                       |
|       . - - .         | Unter 30   12 [##---] |
|      / .  .  \    348 | 30 - 39    64 [####-] |
|     . . . . . . Männl.| 40 - 49    98 [#####] |
|      \ .  .  /        | 50 - 59   152 [#####] |
|       ' - - '         | 60 - 69   174 [#####] |
|                       | 70+        62 [####-] |
| M 55%   W 45%         |                       |
+-----------------------+-----------------------+
```

On widths <= 360px the gender tile drops the per-slice legend row and shows only the centred largest-slice value; age bucket labels shorten to `<30` / `30–39` / etc (still using `–` only in this label-shortening context inside a chart axis — the rest of the codebase rule against em/en dashes still applies). Bar count labels remain.

## Tile anatomy

Every tile is identical structurally:

```
+----------------------------------+
| LABEL                            |   <- header: text-s uppercase opacity-l,
|                                  |      letter-spacing 0.08em, same as the
|        [viz fills here]          |      table SortHeaders below
|                                  |
+----------------------------------+
  ^                              ^
  border: 1px color-mix(in oklab, var(--color-fg) 15%, transparent)
  rounded-m (14px)
  padding: s (8px) all sides; header gets mb-s gap to viz
```

Header label text examples: `GESCHLECHT`, `ALTER`, `PARTEI`. No tooltips on the header. No counts in the header — the totals are read off the viz.

## Geschlecht (pie)

- Recharts `<PieChart>` with two-to-four slices.
- Donut, not a solid pie: inner radius ~55% of outer. Reads cleaner at small sizes and gives the centre room for a label.
- Slices ordered by count desc, starting at 12 o'clock, rotating clockwise.
- Centre label: count of the **largest** slice (not total N — see Log entry for justification). One line: the number in `text-l semibold`, the slice label below in `text-s opacity-l`.
- Legend row below the disc: one inline row, `flex gap-m`, each entry `<dot> M 348 (55%)`. Dot = `inline-block size-2` filled with the slice colour. This row doubles as the legend on hover (no separate legend popout).
- Hover: tooltip `Männlich — 348 (55 %)` using the standard `Tooltip` component (surface + `--color-fg @ opacity-s` border, same as everywhere).

### Empty state (zero filtered)

Replace the disc with a faint dashed circle (1px `--color-fg @ opacity-s`, no fill) at the same diameter, centred text inside: `Keine Daten` at `text-s opacity-l`. Legend row hidden. Tile keeps its full height — never collapse.

## Alter (horizontal bars)

- 6 fixed buckets from `AGE_BUCKETS`. Always render all 6 rows even when some are zero; empty bars communicate the gap.
- Order top-to-bottom: **young → old**. See Log entry.
- Each row is a 3-column subgrid: `[label, fixed width] [count, fixed width, right-aligned] [bar, fills remainder]`.
- Bar height: 8px (`h-2`). Track: `--color-fg @ opacity-s`. Fill: single accent (see below). Bar uses `flex-1` so all bars scale to the same max — the bar with the highest count fills the full track.
- No axis labels, no gridlines. The bar lengths are the only encoding; count appears as text.
- Hover anywhere on a row: tooltip `30 bis 39 — 64 (10 %)`.

### Empty state (zero filtered)

All six tracks render with 0-width fills. A muted overlay reads `Keine Daten` centered over the bars. Labels and zero counts stay visible.

## Partei (horizontal bars, >= md only)

- One row per party present in the filtered set, sorted desc by count.
- Same 3-column subgrid as Alter (label / count / bar).
- Bar fill: party colour via `PARTY_COLOR[party]` from `apps/bundestag/src/lib/parties.ts`. This is the **one** place in the strip where party identity colour is used — it's identity, not decoration, and matches the badge in the table row below.
- Hover: tooltip `Grüne — 85 (13 %)`.
- Default behaviour when the `Fraktion` filter narrows the set to a single party: **keep the tile, show one bar.** See Log entry.

### Empty state (zero filtered)

Same convention as Alter: one ghost row that reads `Keine Daten`, centred.

## Accent tokens

| Slot | Token | Notes |
|---|---|---|
| Pie slice 1 (largest, usually `Männlich`) | `var(--color-gray)` | Neutral, dominant. Reads as "the default majority" without flagging the dimension as a party. |
| Pie slice 2 (`Weiblich`) | `var(--color-teal)` | Distinguishable from gray at small sizes; neutral and not associated with any party (CDU/CSU is gray, but the donut shape disambiguates). Avoids pink/blue gendered cliché. |
| Pie slice 3 (`Divers`, when present) | `var(--color-rust)` | Warm tertiary; only appears when the data has it. |
| Pie slice 4 (`unbekannt`, when present) | `--color-fg @ opacity-m` | Muted, signals "no data" rather than a category. |
| Alter bar track | `--color-fg @ opacity-s` | Same as the border token, visually consistent. |
| Alter bar fill | `var(--color-indigo)` | Single accent. Not used by any party, distinct from the pie slices, neutral. |
| Partei bar fill | `PARTY_COLOR[party]` | Identity. |
| Partei bar track | `--color-fg @ opacity-s` | Identical to Alter. |

The pie deliberately avoids `--color-success` / `--color-danger` (reserved for outcomes) and avoids any party token. The Alter accent (`--color-indigo`) is chosen so that across all three tiles the colour reads as: **neutral facts (gray + teal + indigo) on the left, identity (party colours) on the right**.

## Interactions

- **None.** No click handlers on slices, bars, rows, or the tile itself.
- Hover surfaces the standard `Tooltip` per segment.
- Keyboard focus is not implemented; the strip is non-interactive ARIA `role="group"` with `aria-label="Zusammenfassung der gefilterten Auswahl"`.

## What this emphasizes at a glance

The **shape** of the current filter. A reader who applies "Bundesland: Bayern" should see the gender split and the age skew before counting rows in the table. The strip never tries to be an analysis tool — it's a mirror of the filter row, so the user can trust their filter is doing what they think it's doing.

## Dimensions

| Element | Size |
|---|---|
| Tile inner padding | s (8px) all sides |
| Tile header → viz gap | s (8px) |
| Tile border radius | rounded-m (14px) |
| Tile border | 1px `color-mix(in oklab, var(--color-fg) 15%, transparent)` |
| Tile background | transparent (page `background`) — no `surface` shade, the border alone is enough |
| Tile height (desktop, all three) | 156px fixed. Frontend wraps the viz in `flex-1 min-h-0` so the donut and bars flex inside |
| Tile height (mobile, two tiles) | 144px fixed |
| Strip vertical spacing | mb-l (16px) below filter row, mb-l (16px) above the "N Personen" counter |
| Grid gap | gap-m (12px) between tiles |
| Donut outer diameter (desktop) | 96px |
| Donut outer diameter (mobile) | 80px |
| Donut inner radius | 55% of outer |
| Bar height (Alter & Partei) | 8px (h-2) |
| Bar row vertical gap | gap-xs (4px) between rows |
| Bar label column width | 80px (Alter), 64px (Partei — short names fit) |
| Bar count column width | 36px right-aligned |

## Tokens

| Element | Text size | Weight | Spacing | Component |
|---|---|---|---|---|
| Tile header label (`GESCHLECHT`, `ALTER`, `PARTEI`) | s uppercase, letter-spacing 0.08em | regular, opacity-l | mb-s | — |
| Donut centre count | l | semibold | — | — |
| Donut centre slice label | s | regular, opacity-l | mt-xs | — |
| Donut legend row (`M 348 (55%)`) | s | regular | gap-m, mt-s | — |
| Donut legend dot | — | — | size-2 | — |
| Bar row label (`30 bis 39`) | s | regular | — | — |
| Bar row count | s | semibold | — | — |
| Tooltip body | s | regular | — | Tooltip |
| Empty-state text inside a tile | s | regular, opacity-l | — | — |
| Tile border | — | — | 1px | — |

**Color tokens used:**

| Purpose | Token |
|---|---|
| Tile border | `color-mix(in oklab, var(--color-fg) 15%, transparent)` |
| Pie slice 1 | `var(--color-gray)` |
| Pie slice 2 | `var(--color-teal)` |
| Pie slice 3 (when present) | `var(--color-rust)` |
| Pie slice 4 (when present) | `--color-fg @ opacity-m` |
| Alter bar track | `--color-fg @ opacity-s` |
| Alter bar fill | `var(--color-indigo)` |
| Partei bar track | `--color-fg @ opacity-s` |
| Partei bar fill | `PARTY_COLOR[party]` from `lib/parties.ts` |
| Empty-state ghost circle / overlay text | `--color-fg @ opacity-s` (stroke), opacity-l (text) |

**Components:** Tooltip. The pie itself is a recharts `<PieChart>` (recharts is the agreed chart lib per the broader plan; bars are plain divs and do not need recharts).

## Frontend gotchas

- Recharts `<ResponsiveContainer>` inside a fixed-height tile needs `width="100%" height="100%"` and an absolutely-sized parent — wrap it in a `relative` div with explicit pixel height, not just `flex-1`. Otherwise the donut renders at 0×0 on first paint and only resizes after the next window event.
- The Alter and Partei bars don't need recharts. A plain `div` with a CSS width percentage is lighter and avoids the same ResponsiveContainer trap.
- The donut centre label is a separate absolutely-positioned `<div>` inside the same `relative` wrapper as the recharts container. Recharts' built-in `<Label position="center">` works but truncates at small sizes and ignores our font stack.
- When the filtered set is exactly the full Bundestag (no filters active), the strip should still render — it tells the user "filters off, here is the whole house." No special-casing.
