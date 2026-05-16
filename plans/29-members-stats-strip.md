# 29 — Members stats strip (Geschlecht, Alter, Partei)

## Goal

Insert a small charts row between the filter pills and the table on `/members`. Three read-only charts that summarize the currently filtered set:

```
[ search                                                  ]
[ ⇆ filter pills: Fraktion | Bundesland | Geschlecht | … ]
[ Geschlecht (pie)   |   Alter (h-bars)   |   Partei (h-bars, ≥md)   ]
[ N Personen                                              ]
[ table …                                                 ]
```

Charts are **slaves to the filter row**, not interactive: filters change → table re-filters → charts re-aggregate. No click-to-filter on chart segments. Current Wahlperiode only (the data we already ship). Mobile shows two charts side-by-side (Geschlecht + Alter); the Partei chart appears at `md` and up.

## Why this shape

- Filtering is already client-side in `useMemberListFilters`; charts can read `filtered` directly via a sibling hook. Zero new server work.
- All three dimensions are already in `MemberListItem`: `sex`, `yearOfBirth` (via `ageBucketFor`), `party`.
- Recharts is already in `apps/bundestag/package.json` and used in `PartyHistoryChart.tsx`, so no new dependency.

## Chart specs

### 1. Geschlecht — pie
- Categories: `männlich`, `weiblich`, plus `divers` / `unbekannt` if present in the filtered set. Use `SEX_LABEL` from `lib/ageBuckets.ts`.
- Two main slices use accents from the token palette (not party colors). Pick two muted, distinguishable accents; designer chooses exact tokens.
- Center label: count of largest slice OR total `N`, designer's call.
- Tooltip on hover: `Geschlecht — N (xx %)`.

### 2. Alter — horizontal bars
- Buckets from `AGE_BUCKETS` (`lib/ageBuckets.ts`), order top-to-bottom youngest → oldest (or oldest → youngest if designer prefers; pick one and document).
- Bar label: bucket name + count. Optionally a faint axis or just bar-end labels — designer picks.
- Single accent color, no per-bucket coloring.

### 3. Partei — horizontal bars (≥md only)
- One row per party present in the filtered set, sorted desc by count.
- Each bar uses the **party color** via existing party-color helper (find it; same source as `PartyBadge` / `Hemicycle`).
- Bar label: party short name + count.

## Layout & responsive

- Wrapper: `flex flex-col gap-m md:grid md:grid-cols-3 md:gap-m` (or whatever designer decides). Pie + Alter visible at all widths; Partei hidden below `md` with `hidden md:block`.
- Each chart sits in a tile with a 1px border (`color-mix(in oklab, var(--color-fg) 15%, transparent)`), `rounded-m`, padding `s`.
- Tile header: small uppercase label (`text-s opacity-l`, letter-spacing 0.08em) — same style as the table column headers in `MembersList`.
- Heights tight (~120–160px). Mobile: pie tile and Alter tile share a row, so they need to be narrow.
- Page is `max-w-3xl` (~768px); the three-column layout has to breathe inside that. Designer should validate.

## Files to add / touch

New:
- `apps/bundestag/src/views/membersList/MembersStatsStrip.tsx` — the row, three tile children.
- `apps/bundestag/src/views/membersList/MembersStatsStrip.mock.md` — ASCII mock (designer's output).
- `apps/bundestag/src/views/membersList/GenderPie.tsx`
- `apps/bundestag/src/views/membersList/AgeBars.tsx`
- `apps/bundestag/src/views/membersList/PartyBars.tsx`
- `apps/bundestag/src/hooks/useMemberStats.ts` — pure aggregator: `(filtered: MemberListItem[]) => { gender, age, party }`. No filtering logic, just counts.

Touch:
- `apps/bundestag/src/views/membersList/MembersList.tsx` — render `<MembersStatsStrip stats={stats} />` between the filter pill row and the "N Personen" line.
- `apps/bundestag/src/routes/members/index.tsx` — call `useMemberStats(filtered)` from the hook, pass `stats` to `MembersList`.

Don't touch:
- `db/schema/*`, `etl/*`, `apps/bundestag/src/server/*`.
- `useMemberListFilters.ts` — keep it focused on filtering, stats live in a separate hook.

## Contracts

```ts
export type MemberStats = {
  gender: Array<{ key: MemberSex; label: string; count: number }>
  age: Array<{ key: AgeBucket; label: string; count: number }>
  party: Array<{ key: string; label: string; color: string; count: number }>
}
```

`MembersStatsStrip` receives `stats: MemberStats`. Each child chart receives only its own slice plus `total: number` if needed for percentages.

## Edge cases

- Filtered set empty → render the strip with empty-state placeholders inside each tile (faint `–` glyph or "Keine Daten"). Do **not** collapse the strip; layout shifting on filter change is worse.
- Filtered set down to one party → Partei chart shows one bar. Acceptable, designer can decide whether to dim or hide that tile when there is exactly one party. Default: show.
- `yearOfBirth` null → counted in neither age bar nor anywhere (skip).

## Status

- designer: done — `apps/bundestag/src/views/membersList/MembersStatsStrip.mock.md` covers desktop + mobile, pie centre uses largest-slice value, age bars run young → old, single-party Partei tile stays visible. Accents: pie = gray + teal (+ rust + opacity-m for diverse/unknown), Alter bars = indigo, Partei bars = `PARTY_COLOR`.
- frontend: unblocked

## Open questions

- (designer) Pie center label: total `N` or largest slice value?
- (designer) Age bars order: young → old or old → young?
- (designer) When the Partei filter is active (single party left), hide the Partei tile or keep it with one bar?

## Log

### designer — 2026-05-14

Mock at `apps/bundestag/src/views/membersList/MembersStatsStrip.mock.md`.

- **Pie centre label: largest-slice count, not total N.** The total N is already shown immediately below the strip as "N Personen" — duplicating it in the donut centre wastes the most prominent slot in the viz. The largest-slice value is the headline the donut is actually trying to tell: "of this filtered set, the dominant gender is X, and there are Y of them." Slice label sits under the number so the reader doesn't have to map a colour to a legend before reading the number.
- **Age bars order: young → old (top to bottom).** Reads like a life timeline going down the page, matches how the `AGE_BUCKETS` array is already ordered in `lib/ageBuckets.ts` (no need to reverse), and puts the buckets most affected by the filter shape (the tails: under-30 and 70-plus) at the visual extremes where deltas are easiest to spot.
- **Single-party Partei tile: keep, show one bar.** Hiding the tile would shift the layout on every Fraktion filter change, which is worse than a slightly redundant single bar. The single bar is still informative because it carries the count, and the consistent layout makes the strip easier to scan when toggling filters rapidly.

Accent tokens confirmed in the mock's "Accent tokens" section: pie = `--color-gray` + `--color-teal` (+ `--color-rust`, + `--color-fg @ opacity-m` for the rare divers/unbekannt cases); Alter bar fill = `--color-indigo`; Partei bar fill = `PARTY_COLOR[party]`.

### frontend — 2026-05-14

Files added:
- `apps/bundestag/src/hooks/useMemberStats.ts` — pure aggregator over `filtered`. `MemberStats` type extends the gender union with `'unbekannt'` so members with `sex: null` still count toward the gender total (mock spec). Age aggregation skips null `yearOfBirth` per the Edge cases section. Gender sorted desc by count, Age in `AGE_BUCKETS` order (young → old), Party desc by count.
- `apps/bundestag/src/views/membersList/MembersStatsStrip.tsx` — `grid grid-cols-2 md:grid-cols-3 gap-m` wrapper, fixed-height tiles (144px mobile / 156px desktop), Partei tile `hidden md:flex`.
- `apps/bundestag/src/views/membersList/GenderPie.tsx` — recharts `<PieChart>` donut, inner radius 55%, outer 80/96px responsive. Absolutely-positioned centre overlay shows largest-slice count + label. Legend row drops below 361px viewport per mock. Empty state = dashed ghost circle.
- `apps/bundestag/src/views/membersList/AgeBars.tsx` — plain divs, 6 rows always, subgrid `[80px][36px][1fr]`. Bars normalize against the max count among rendered rows.
- `apps/bundestag/src/views/membersList/PartyBars.tsx` — plain divs, same subgrid with 64px label column. Sorted desc by count, party-coloured fills.

Files touched:
- `apps/bundestag/src/routes/members/index.tsx` — `useMemberStats(filtered)` after the filter hook, `stats` passed to `<MembersList>`.
- `apps/bundestag/src/views/membersList/MembersList.tsx` — new `stats` prop, strip rendered in a `mb-l` wrapper between filter pill row and the "N Personen" counter.

Recharts prerender: as the mock's gotcha list predicted, `<ResponsiveContainer>` only emits its outer wrapper at build time (no inner SVG paths in the prerendered HTML, since `ResizeObserver` doesn't exist in SSR). The centre label is rendered as a separate absolutely-positioned div, so the largest-slice count + label is visible immediately on first paint even before recharts hydrates. The donut SVG slices paint on hydration. The fixed-pixel parent (`h-[80px]/h-[96px]`) prevents the 0×0 trap.

Build: `npm run build` clean, `/members/` index.html contains the strip markup (`Zusammenfassung der gefilterten Auswahl` aria-label, `Männlich`, `Unter 30`, percentages). All other prerender paths green.

Verification on dev tunnel: deferred to operator — local build artifacts confirmed correct; tunnel preview is the operator's call.
