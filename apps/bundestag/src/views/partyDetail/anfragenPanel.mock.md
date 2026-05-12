# /parties/:id — Anfragen aggregate panel

Lives in the grid of panels above the Abstimmungen list, alongside `Übereinstimmung`, `Anträge`, `Großspenden`. Same composition idiom as those: section caption + horizontal stacked bars / lists, no chart libraries.

## Layout

```
  ANFRAGEN                              2.094 in WP21

  Typ
  +-----------------------------------------------------+
  | Kleine          1.612 [###############----]   77%  |
  | Schriftliche      470 [#####--------------]   22%  |
  | Grosse              12 [-------------------]    1%  |
  +-----------------------------------------------------+

  Top Themen (Sachgebiet)
  +-----------------------------------------------------+
  | Wirtschaft               412 [###############----] |
  | Verteidigung             318 [############-------] |
  | Inneres                  244 [#########----------] |
  | Gesundheit               201 [########-----------] |
  | Staat und Verwaltung     187 [#######------------] |
  | Auswaertiges             142 [######-------------] |
  | Umwelt                    98 [####---------------] |
  | Sozialpolitik             76 [###----------------] |
  +-----------------------------------------------------+

  Top Schlagworte (Deskriptor)
   #Migration  #Ukraine  #Energiepreis  #Buergergeld
   #Bundeswehr  #China  #Cannabis  #Wohnungsbau
   #Inflation  #Pflege  #Klimaschutz  #Asylverfahren
```

### Empty state (small parties / no Anfragen)

```
  ANFRAGEN                              0 in WP21

  +-----------------------------------------------------+
  |                                                     |
  |   Diese Fraktion hat keine Anfragen mitgezeichnet.  |
  |                                                     |
  +-----------------------------------------------------+
```

## Interactions

- Click a Sachgebiet row → navigates to `/anfragen?party=…&sachgebiet=…` (future list view; for now an inert hover state is acceptable).
- Click a Schlagwort chip → same, with `deskriptor` instead.
- Tooltip on each bar: exact count and percentage.
- No filters inside the panel — it's a "story strip", not a workspace.

## Notes (hierarchy, empty state, what the user does)

- **Hierarchy decision:** type split first (smallest, most stable), then top Sachgebiete as the headline visual (this is the panel's story), then granular Deskriptor tags as a chip cloud for browsability.
- **Composition mirrors `DonationsBar` / `ProposalsBar`**: caption row, stacked horizontal bar segments, `flex h-8 w-full gap-[2px]`. Frontend re-uses the existing bar component.
- **Color discipline:** all bars use `var(--color-fg)` at descending opacity (or a single `--color-fg @ opacity-m` fill). Party color is **not** used for chart values. Type-split bar segments use neutral fg tones, ordered largest-first.
- **Top headline number** (`2.094 in WP21`) sits `ml-auto` next to the section caption, matching how seat count sits next to the party `<h1>` and how Großspenden shows total EUR.
- **Empty state** is rare (every Fraktion files at least Kleine Anfragen) but renders as a single muted card so the grid doesn't collapse.

## Tokens

| Element | Text size | Weight | Spacing | Component |
|---|---|---|---|---|
| Section caption (`ANFRAGEN`) | s uppercase, letter-spacing 0.08em | regular, opacity-l | mb-s | — |
| Total count (right of caption) | s | regular, opacity-l | ml-auto | — |
| Sub-caption (`Typ`, `Top Themen`, `Top Schlagworte`) | s | regular, opacity-m | mt-m, mb-xs | — |
| Bar row label | s | regular | — | — |
| Bar row count | s | semibold | — | — |
| Stacked bar | — | — | h-8, gap-[2px] | — |
| Schlagwort chip | s | regular | px-s py-xs, gap-xs | Badge |
| Empty state | m | regular | p-l | Card |
| Tooltip (count + %) | s | regular | — | Tooltip |

Components used: Card, Badge, Tooltip.

## Open design questions for lead

- **Should the panel link out to a dedicated `/anfragen` list view?** Currently no such route exists. If we want the chips/rows to be clickable, that's a follow-on plan. For this iteration they can be inert.
- **Headline metric choice.** Total Anfragen count is shown; alternative would be "Anfragen je Mitglied" (per-MP density), which normalises across party sizes. Worth a take from lead before frontend builds.
- **Deskriptor chip cap.** Mock shows 12 chips. Could be 8 (tighter) or "show more" disclosure. Default 12 unless told otherwise.
