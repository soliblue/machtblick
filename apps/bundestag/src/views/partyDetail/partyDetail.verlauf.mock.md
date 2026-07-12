# /parties/:id, Verlauf tab

Third tab on the party detail page, alongside `Abstimmungen` and `Mitglieder` (the existing trio gets a new entry). Lives inside the same `max-w-3xl` column. Single chart: the party's share of the Bundestag across every term it (or any lineage predecessor) sat in, with lineage events marked.

## Layout

```
+------------------------------------------------------------------+
| [Logo] Die Linke                                  64 Sitze       |
|                                                                  |
| [ Abstimmungen ] [ Mitglieder ] [ Verlauf ]                      |
|                  ----------------------------                    |
|                                                                  |
|  ANTEIL AM BUNDESTAG                          1990 - heute       |
|                                                                  |
|     [Lineage] PDS  >  PDS  >  Die Linkspartei.PDS  >  Die Linke  |
|                                                                  |
|     SED-PDS    PDS umbenannt          Fusion mit WASG     BSW    |
|     gegruendet                                          abgespalten
|        v             v                       v                v  |
|     +- - - - - - - - - - - - - - - - - - - - - - - - - - - - +  |
|  20%|                                                         |  |
|     |                                       11.1%   8.7%      |  |
|  15%|                                          . - . -        |  |
|     |                  . 8.5%   8.7%       .            .     |  |
|     |        4.4%   .  ###########       .                  . |  |
|  10%|         . - .   #############    .  8.0%   9.2%      8.8%
|     |       .       #################                          |  |
|     |  2.4%       ###################                          |  |
|   5%|     .     #####################                          |  |
|     |  . #######################################               |  |
|   0%|##############################################            |  |
|     +- - - - - - - - - - - - - - - - - - - - - - - - - - - - +  |
|       12.   13.   14.   15.   16.   17.   18.   19.   20.   21.  |
|       '90   '94   '98   '02   '05   '09   '13   '17   '21   '25  |
|                                                                  |
|     [Legende]   .--.  % der Sitze     v  Ereignis (Lineage)      |
+------------------------------------------------------------------+
```

### Event strip (zoomed)

When 3-5 events stack across 50 years, labels need room to breathe. They sit **above** the plot area, anchored by a thin vertical guide line that drops into the chart at the event's x-position. Direction is encoded in the icon, not the line.

```
                                                                  
    [v-]  inbound merger    (predecessor joins us / we absorb)    
    [-v]  outbound split    (faction leaves us)                   
    [<>]  rename            (lineage continues, label changes)    
    [+ ]  founded                                                 
    [x ]  dissolved                                               
                                                                  
    Founded      Renamed        Inbound          Outbound         
       +            <>            v-                -v            
       |            |             |                 |             
       |            |             |                 |             
    - - - - - - - - - - - - - - - - - - - - - - - - - - - - -    
```

When two events fall in the same term (rare, e.g. a rename in the same year as a merger), the second label stacks below the first with a shared guide line; the icon row stays on a single horizontal band so it never collides with the chart curve.

```
       Fusion mit WASG
       v-
       Die Linkspartei.PDS -> Die Linke
       <>
       |
    - - - - - - - - - - - - - - - - - - - - - - - -
```

### Tooltip on hover (dot or area)

```
+---------------------------------------+
|  18. Wahlperiode                      |
|  22.10.2013 - 24.10.2017              |
|                                       |
|  Name damals    Die Linke             |
|  Sitze          64 von 631            |
|  Anteil         10.1%                 |
+---------------------------------------+
```

### Tooltip on hover (event marker)

```
+---------------------------------------+
|  16.06.2007                           |
|  Fusion mit WASG                      |
|                                       |
|  Die Linkspartei.PDS + WASG           |
|  -> Die Linke                         |
+---------------------------------------+
```

### Empty / single-term state (e.g. BSW, founded 2024)

```
+------------------------------------------------------------------+
|  ANTEIL AM BUNDESTAG                                 seit 2025   |
|                                                                  |
|                                                                  |
|             BSW sitzt erst seit der 21. Wahlperiode              |
|                       im Bundestag.                              |
|                                                                  |
|                  Ein Verlauf wird sichtbar,                      |
|              sobald mindestens zwei Wahlperioden                 |
|                       erfasst sind.                              |
|                                                                  |
|                                                                  |
|   Aktuell    6.2%  (39 von 630 Sitzen, 21. WP)                   |
+------------------------------------------------------------------+
```

When a lineage has exactly **two** terms, the chart still renders (a line is two points). Empty state only triggers on **one** term.

### Pre-1990 East German lineages

For PDS and only PDS, the timeline begins at the **12. Wahlperiode (1990)**, the first all-German Bundestag. The "SED-PDS gegruendet" event marker sits at the leftmost edge, anchored to term 12, with a tooltip noting that pre-reunification Volkskammer data is intentionally excluded. No data points before term 12.

## Interactions / filters

- **No filters.** The chart is a single story. Out of scope: switching between % seats and absolute count, toggling vote share, comparing parties.
- **Hover a dot**: tooltip described above; the dot enlarges from r=3 to r=5; the connected area segment darkens by one opacity step.
- **Hover an event marker**: the guide line goes from opacity-m to opacity-l; tooltip described above.
- **Click a dot**: navigates to `/votes?term=18` (term-filtered votes list). Future; inert in v1.
- **Click an event label**: scrolls the page tooltip into view on mobile (no nav).
- **Keyboard**: tab order is left-to-right across dots, then event markers. Focus ring on the dot, not on invisible recharts internals.

## What this emphasizes at a glance

The arc of a party's parliamentary weight, and the moments when its identity changed. A reader who lands here for "Die Linke" should immediately see the 2007 WASG fusion as a bump in the line and read the marker without looking up Wikipedia.

## Notes

### Library choice: **recharts with a hand-rolled SVG overlay for event labels.**

- Recharts handles the line, the gradient area fill, the dots, the labels-on-dots, the axes, and the value tooltips. All standard.
- Recharts' `ReferenceLine` can render vertical event lines and accepts a `label` prop, but the label positioning is fragile when 3-5 stack horizontally. recharts will overlap them or push them outside the SVG viewport. It has no concept of "label collision avoidance."
- The cleanest fix: render a sibling `<div>` absolutely positioned over the chart container, containing the event-label strip. Compute x-positions from the same term-to-pixel scale recharts uses (export it from a memoized helper). Each label is a real DOM node so it can wrap text, stack vertically when adjacent, and receive proper hover / focus.
- This is **less code than switching to visx** and keeps the team on the library agreed in the plan. Visx would only win if we needed brushing, zooming, or richer transitions, none of which v1 needs.

### Visual encoding

- **Line + area**: the party's `PARTY_COLOR` is the stroke. The area below it is a vertical gradient: same color at opacity-m at the top, fading to opacity 0 at y=0. This is the **only** place party color appears in the chart, never on event markers or axes.
- **Dots**: solid party color, r=3, with a 1px `--color-background` halo so they remain visible against the area fill. Hover -> r=5.
- **Value labels** sit above each dot at `text-s opacity-l`. Recharts `<LabelList dataKey="pctOfTotal">`. Skipped when two consecutive terms differ by less than 1.5 percentage points and the labels would collide; in that case the lower one is dropped (tooltip still shows it on hover).
- **Event markers**: vertical dashed line at `--color-fg @ opacity-m`, 1px stroke. Icon-and-label sit in the strip above the plot. Label text `text-s` at `--color-fg` (full opacity, these are important annotations).
- **Direction glyphs** for events:
  - Inbound merger (`merged_in`): `v-` arrow head pointing **into** the trunk line. Visually reads "we absorbed someone."
  - Outbound split (`split_out`): `-v` arrow head pointing **away** from the trunk. Reads "someone left us."
  - Rename (`renamed`): `<>` (a swap glyph).
  - Founded (`founded`): `+`.
  - Dissolved (`dissolved`): `x`.
  - In production these are `lucide-react` icons: `ArrowDownLeft` / `ArrowDownRight` / `Replace` / `Plus` / `X` at size-s (14px).
- **Axes**: x-axis is term number (12., 13., ...) with election year secondary tick below. Y-axis is `0%, 5%, 10%, ...` with auto-scaling. Only render gridlines up to the next 5% above max. Gridlines `--color-fg @ opacity-s`.
- **Lineage breadcrumb above the chart**: text-s, separator `>`, opacity-l, semibold on the current name. Anchors the reader before they scan the chart.

### Color discipline

- Party accent: **line + area only**. Never on event markers, axes, gridlines, or tooltip headers.
- Event markers: neutral `--color-fg` (full opacity for label, opacity-m for guide line).
- Tooltip backgrounds: `--color-surface` with `--color-fg @ opacity-s` border.
- Empty state: no party accent. The current % below is rendered with party color as a subtle inline accent dot, not as a fill.

### What is **not** in this view

- No comparison to other parties. That's a future "Composition" page that overlays multiple lineage timelines for a single term-axis.
- No Zweitstimmen / vote share. v1 is seats-only. The seat count is what made a difference in the chamber.
- No CDU/CSU sister-party merging. They show as separate lines on separate pages (per plan).
- No legend for line color (party color = the page subject, redundant). The legend block at the bottom only explains the event-marker glyphs and the value-label dotted line.

### Mobile (<= 420px)

The chart keeps full width. The event strip above wraps to two rows when needed. The lineage breadcrumb collapses to "PDS  >  ...  >  Die Linke" (middle elided) and the full chain appears as a tooltip on tap. Y-axis labels move inside the plot area against the leftmost gridline. Dot labels are dropped (tooltip-only) below 360px because they cannot fit without overlap.

```
+----------------------------------+
|  ANTEIL AM BUNDESTAG  1990-heute |
|  PDS  >  ...  >  Die Linke       |
|                                  |
|  Fus.WASG    BSW                 |
|     v-       -v                  |
|  +-|---------|--+                |
|  |             .|                |
|  |        . - . |                |
|  |     .        |                |
|  |   .          |                |
|  | .            |                |
|  +-|---------|--+                |
|   12  14  16  18  20  21         |
|   '90 '98 '05 '13 '21 '25        |
+----------------------------------+
```

## Tokens

| Element | Text size | Weight | Spacing | Component |
|---|---|---|---|---|
| Tab label (`Verlauf`) | m | regular | | Tabs |
| Section caption (`ANTEIL AM BUNDESTAG`) | s uppercase, letter-spacing 0.08em | regular, opacity-l | mb-s | |
| Range marker (`1990 - heute`) | s | regular, opacity-l | ml-auto | |
| Lineage breadcrumb | s | regular (semibold on current name), opacity-l | mt-xs, mb-m | |
| Event label | s | regular | gap-xs above plot | |
| Event icon | size-s (14px) | | mr-xs | lucide-react icon |
| Event guide line | | | | SVG, 1px, stroke-dasharray |
| Axis tick label (term + year) | s | regular, opacity-l | | recharts XAxis |
| Y-axis label | s | regular, opacity-l | | recharts YAxis |
| Value label on dot | s | regular, opacity-l | | recharts LabelList |
| Tooltip header (term) | m | semibold | | recharts Tooltip / hand-rolled |
| Tooltip body | s | regular | gap-xs | |
| Tooltip border | | | | `--color-fg @ opacity-s` |
| Chart container padding | | | py-m (top for event strip), px-0 | |
| Empty state | m | regular | p-l | Card |
| Empty state current-% line | m | semibold (party-colored dot) | mt-m | |
| Legend at bottom | s | regular, opacity-l | mt-m, gap-m | |

**Color tokens used:**

| Purpose | Token |
|---|---|
| Line stroke + area gradient | `PARTY_COLOR[party]` |
| Area gradient bottom | same, opacity 0 |
| Event guide line | `--color-fg @ opacity-m` |
| Event label text + icon | `--color-fg` |
| Gridlines + axis | `--color-fg @ opacity-s` |
| Dot halo | `--color-background` |
| Tooltip border | `--color-fg @ opacity-s` |
| Tooltip surface | `--color-surface` |

**Components:** Tabs, Tooltip, Card (empty state only). Plus recharts primitives (LineChart, Area, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, LabelList). These are not in our curated component set, but recharts is the agreed chart library per the plan, so its primitives are an exception scoped to this view.

## Open design questions for lead

- **Term anchoring of events.** A merger that legally took effect on `2007-06-16` happens *during* the 16th Wahlperiode. Do we anchor the marker to the start of the term in which it happened (term 16, x = 2005), to the exact date (interpolated x between term 16 and 17 dots), or to the *next* term where the new name first appears in seat data (term 17, x = 2009)? Mock above interpolates to the date. Visually accurate, but means markers don't line up with axis ticks. Lead should confirm.
- **What counts as "the trunk"?** Plan says "predecessor with the largest seat share is the trunk." For Die Linke, the trunk is PDS (clear). For a hypothetical case where two roughly equal parties merge into a new name (e.g. SPD + USPD in 1922), neither is dominant. Out of scope for v1 since this doesn't happen in the post-1949 Bundestag, but flagging.
- **Pre-1949 / pre-1990 footnote placement.** Mock shows it inline as a tooltip on the leftmost event marker. Could also be a single muted line below the chart ("Daten ab 12. Wahlperiode, vor 1990 nicht erfasst."). Designer's preference is the tooltip; lead may want it explicit.
- **Click-through to votes.** Mock describes clicking a dot to navigate to `/votes?term=N`. Currently that route doesn't support `term` filtering. Either the votes list gains a term filter (out of scope for this plan) or we drop the interaction in v1 and reintroduce it later. Recommend the latter.
