# /members

Round-5 rehaul (plan 105) to the plan-102 card language. Supersedes the table +
stats-strip design entirely (old mock and MembersStatsStrip.mock.md retired).

One component, both devices: a **MemberCard** (photo, name, party, state, two
stats) laid in a responsive grid. Mobile 2 columns, desktop 5. No table, no
recharts donuts. The scan signal is the wall of faces: a citizen recognizes
their MP before reading a single word, and the attendance bars rank the grid
visually without any numbers being read.

## What a citizen wants here

1. Find their MP: search by name (always-visible input), or filter Bundesland.
2. Browse by party: filter pill / bottom sheet; every card carries the party logo.
3. See who shows up: attendance bar on every card, sortable; Linie surfaces the
   rank-breakers.

## Layout, mobile (< 700px, 390px primary artifact)

```
+------------------------------------------+
| Machtblick (app nav, sticky)          =  |
|                                          |
| [ o| Abgeordnete durchsuchen........... ]|  <- search input, own row, NOT sticky;
|                                          |     1px fg@15 border, radius 0
| 637 PERSONEN                             |  <- caption row: text-s caps fg@70
|                                          |
| .------------------. .------------------.|
| |                  | |                  ||
| |     [FOTO]       | |     [FOTO]       ||  <- photo: aspect-square, full-bleed
| |   aspect 1:1     | |                  ||     to card edges (no padding above),
| |                  | |                  ||     object-cover, loading=lazy;
| |------------------| |------------------||     fallback: initials on `surface`
| | Erika            | | Max              ||
| | Musterfrau       | | Beispiel         ||  <- name: text-m semibold, clamp 2,
| | (SPD) Berlin     | | (CDU) Bayern     ||     2-line min-height (uniform cards)
| |                  | |                  ||  <- meta: party LOGO 17px + state,
| | ANWESENHEIT  94% | | ANWESENHEIT  98% ||     text-s fg@70, truncate
| | [##########----] | | [#############-] ||
| | LINIE       100% | | LINIE        91% ||  <- stat block, see anatomy below
| '------------------' '------------------'|
| .------------------. .------------------.|
| |     [FOTO]       | |     [FOTO]       ||
| |       ...        | |       ...        ||
|                                          |
|            ( Filter · 0 )                |  <- floating filter pill, bottom
+------------------------------------------+     center, fg fill, funnel icon
```

- Grid: `grid-cols-2 gap-s`, page padding l, normal scroll (no snap feed; a
  directory is browsed, not paged one-per-screen).
- No pill row on mobile. Floating filter button + bottom sheet (reuse the
  votes-feed FilterSheet idiom): drag handle, caption-labeled groups
  **Fraktion, Bundesland, Geschlecht, Alter, Mandat**, plus a **Sortierung**
  group (chips: Name, Anwesenheit, Linie; tapping the active chip flips
  direction, arrow in the chip label). Applies immediately, count in the
  button label counts active filter values (sort does not count).
- Search stays a visible input at the top on both devices: finding a specific
  MP is the number-one task and must not hide behind the sheet.
- No masthead, no visible h1 (sr-only stays).

## Layout, desktop (>= 700px, container max-w-5xl centered)

```
| Machtblick   Abstimmungen  Abgeordnete  Reden  Fraktionen        [Deutsch] |
| [ o| Abgeordnete durchsuchen................................. ]           |
| v [Fraktionen v] [Bundesland v] [Geschlecht v] [Alter v] [Mandat v]       |  <- FilterPillRow, sticky
|                                                                            |
| 637 PERSONEN                                     SORTIEREN: NAME [^]      |  <- caption row: count left,
|                                                                            |     sort control right
| .---------. .---------. .---------. .---------. .---------.               |
| | [FOTO]  | | [FOTO]  | | [FOTO]  | | [FOTO]  | | [FOTO]  |               |
| |         | |         | |         | |         | |         |               |
| |---------| |---------| |---------| |---------| |---------|               |
| | Erika   | | Max     | | Lena    | | Jonas   | | Mia     |               |
| | Musterfr| | Beispiel| | Platzha.| | Demo    | | Muster  |               |
| | (SPD) BE| | (CDU) BY| | (GRU) HH| | (FDP) NW| | (LIN) SN|               |
| | ANW. 94%| | ANW. 98%| | ANW. 92%| | ANW. 89%| | ANW. 97%|               |
| | [#####-]| | [######]| | [#####-]| | [####--]| | [######]|               |
| | LINIE   | | LINIE   | | LINIE   | | LINIE   | | LINIE   |               |
| |    100% | |     91% | |     97% | |    100% | |     88% |               |
| '---------' '---------' '---------' '---------' '---------'               |
| .---------. .---------. .---------. .---------. .---------.               |
| |   ...   | |   ...   | |   ...   | |   ...   | |   ...   |               |
```

- Same MemberCard, reflowed: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4
  lg:grid-cols-5 gap-m`. Container widens from max-w-3xl to **max-w-5xl**
  (a face grid needs the width; the table never did).
- FilterPillRow sticky under the app nav (funnel icon lead-in, opaque bg,
  bottom hairline), exactly the votes-desktop idiom. Search input sits on its
  own row above it, not sticky.
- Sort control: right end of the caption row, FilterPill-styled dropdown,
  label `Sortieren`, value = active key + direction arrow; selecting the
  active key again flips direction. Keys: Name, Anwesenheit, Linie.
  (Party and Bundesland ordering are retired as sort keys: the filters cover
  that browse path, and a grouped grid reads no better than a filtered one.)

## MemberCard anatomy

```
.--------------------------.
|                          |   photo: aspect-square, object-cover, full-bleed,
|          [FOTO]          |   loading=lazy; no-photo fallback = initials
|                          |   (text-xl semibold fg@40) centered on `surface`
|--------------------------|
|  Erika Musterfrau        |   name: text-m semibold, clamp 2, min-h 2 lines
|  (logo) Berlin           |   meta: PartyLogo 17px + Bundesland, text-s
|                          |   fg@70, single line truncate
|  ANWESENHEIT        94%  |   caption text-s caps fg@70 left, value text-s
|  [##############------]  |   semibold tabular fg right; bar h-[3px], fill
|  LINIE             100%  |   success on fg@15 track (attendance = positive
'--------------------------'   metric); LINIE value plain fg, no bar, `-`
                               when null (never voted)
```

- Card = card language: white `background`, 1px fg@15 border + soft double
  shadow, **radius 0**, no verdict chip (members carry no status; the 3px
  colored top edge is a vote-outcome device and does not appear here).
- Text block padding m (photo is flush to the top and side edges).
- Whole card is one stretched link to `/members/:id/votes/`, aria-label =
  name, party, state, attendance. The party logo is NOT a separate link
  (too-dense tap targets in a grid; party browsing lives in the filter).
- No party color anywhere except the logo itself (identity only). Attendance
  bar is the single accent (success); everything else fg-opacity ladder.

## Filters / interactions

- Search (top, both devices): live substring filter on name, unchanged logic.
- Desktop pills: Fraktionen, Bundesland, Geschlecht, Alter, Mandat
  (existing FilterPill options and URL semantics unchanged).
- Mobile: floating `Filter · n` button -> bottom sheet with the same five
  groups + Sortierung group. Same state, same URL semantics.
- Sort: Name (default, asc), Anwesenheit, Linie; re-select flips direction.
- Card click -> member detail. Hover: existing opacity easing on the card
  (photo gets no zoom effects; calm surface).
- Empty result (search/filter yields 0): centered `Keine Abgeordneten
  gefunden` text-s fg@70 in the grid slot, nothing else.

## What this emphasizes at a glance

A wall of faces: you find your MP by recognition, read party from the logo,
and the green attendance bars rank the whole grid visually before any number
is read.

## Why (decisions)

- **Card grid over table:** the card language's one-component rule kills the
  old two-layout split (squeezed table on mobile). A face is the strongest
  possible key for "find my MP", and 5 columns of compact cards show as many
  members per desktop screen as the table did, with strictly more information
  (photo). Table stays legitimate for dense rosters in general, but this
  roster's primary lookup key is a person, not a number.
- **Stats strip deleted, not restyled:** the three recharts donuts (gender /
  age / party) used multicolor slices as decoration, violating color-is-
  meaning, and their job (mirror the filtered set's shape) is done better by
  the grid itself: faces show gender and age, logos show party, the count
  shows size. Party composition as a viz belongs to /parties/ (hemicycle).
- **Loyalty stays visible on every card** (not only deviators) because Linie
  is a sort key; sorting by an invisible value is disorienting. The near-
  uniform 100% column cost the table a fifth of its width; on the card it is
  one quiet text line.
- **Attendance is the only bar** because it is the only high-variance metric;
  two bars per card would halve the signal of both.
- **Search stays outside the sheet** on mobile: it is the page's primary
  action, and the feed rule "no pill row on mobile" governs filters, not
  search.

## Implementation notes for frontend

- **Backend touch needed:** `MemberListItem` (`src/server/members.ts`) lacks
  `pictureUrl`; add it (members table already stores it, the detail payload
  ships it). Nothing else on the payload changes.
- **Survives:** `useMemberListFilters` (all filter state, query, sortKey/
  sortDir; drop `party`/`state` from `MemberSortKey`), `FilterPill` /
  `FilterPillRow` (desktop, unchanged), the votes-feed FilterSheet (extend
  with a Sortierung group; sort chips set sortKey/flip sortDir instead of a
  filter value), search input markup, `PartyLogo` (17px), stretched-link
  idiom, `initials()` helper for the photo fallback.
- **Dies:** `MemberRow.tsx`, `SortHeader.tsx` (no table headers anymore),
  `MembersStatsStrip.tsx`, `GenderPie.tsx`, `AgePie.tsx`, `PartyPie.tsx`,
  `PieDonut.tsx`, `useMemberStats` (and its wiring in the route), the old
  `MembersStatsStrip.mock.md`. If recharts has no remaining importer after
  this, drop the dependency.
- **New:** `MemberCard.tsx` (one file, the whole card), sort dropdown on the
  caption row (reuse FilterPill's popover styling; do not add a shadcn
  Select variant for this).
- **Images:** `loading="lazy"` + `decoding="async"` on all card photos; 630
  images is fine lazily but eager would not be. Fixed aspect-square box
  prevents layout shift before load.
- **i18n:** keys needed: `sortLabel` ("Sortieren"/"Sort"), `noMembersFound`;
  `attendance`, `line`, `people`, filter labels all exist.
- **Prerender:** same `/members/` route, CSS-only divergence; nothing to add
  to `prerenderPaths()`.

## Tokens

| Element | Size/weight | Notes |
|---|---|---|
| Card name | m semibold | clamp 2, min-h 2 lines |
| Card meta (logo + state) | s regular, fg@70 | truncate |
| Stat captions (ANWESENHEIT, LINIE) | s caps regular fg@70 | `caption` utility (0.08em) |
| Stat values | s semibold, tabular-nums, fg | |
| Attendance bar | h-[3px] | fill `--color-success`, track fg@15 |
| Count caption (637 PERSONEN) | s caps fg@70 | left of caption row |
| Sort control | FilterPill styling | right of caption row, desktop |
| Card | white bg, 1px fg@15 border, double shadow, radius 0 | text padding m, photo full-bleed |
| Grid | gap-s mobile / gap-m desktop | cols 2/3/4/5 |
| Photo | aspect-square, object-cover | fallback initials xl semibold fg@40 on `surface` |
| Container | max-w-5xl, p-l | was max-w-3xl |

Colors: success (attendance fill) + fg opacity ladder + party logos (identity
only). No party color in stats, no rainbow donuts, no third weight.
Components: FilterPill(Row), FilterSheet, Tooltip (none needed on cards),
everything else bespoke view code.

## Rejected alternatives (do not re-propose)

- Table on desktop + cards on mobile: exactly the banned second-layout-per-
  breakpoint split.
- Restyled donut strip (VoteDistributionDonut-style gender/age minis): even
  token-clean donuts duplicate what the face grid already shows; deleted
  instead.
- Snap feed of full-screen member cards: one member per screen is storytelling
  pacing; a 630-person directory needs density, not pacing.
- Attendance + Linie as twin bars: two bars halve the readability of both.
- Party color as card accent or photo border: identity color is logo-only.
