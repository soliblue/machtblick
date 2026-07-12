# Member detail, Abstimmungen tab

> **Superseded (plan 105 round 9).** The Abstimmungen redesign now lives in
> `memberDetail.mock.md`: options 1-3 below are retired (the topic galaxy has no
> `topic` field on `MemberVoteRow`; the term ribbon reads as a barcode at WP21
> vote density). The row principle (choice-colored lead, outcome as faint
> trailing chip, ABW surfaced) carried over. Kept for the rationale record.

Route: `/members/$id` (Abstimmungen tab)
Width target: max-w-3xl (mobile portrait ~52ch)

---

## The problem with today

```
ABSTIMMUNG                          DATUM      STIMME     LINIE
─────────────────────────────────────────────────────────────────
Heizungsgesetz Änderungsantrag      14.06.24   Nein       Linie
Bürgergeld Reform                   22.03.24   Ja         Abw
Wehrpflicht Wiedereinführung        08.02.24   Enthalten  Linie
…(150 more rows of this)
```

Four text columns. The eye can't tell at a glance:
- *Is this MP a loyal soldier or a frequent defector?*
- *When in her term did the defections cluster?*
- *Which topics make her break ranks?*

The story is in the data (`defected`, `result`, `topic`, `date`), but a table flattens it. Three directions follow, ordered by recommendation.

---

## Option 1 (recommended): **Term ribbon + topic galaxy**

A two-strata header tells the *story* before the list does. Below, the list is denser than today but only because the chart above carries the gestalt.

### Strata 1: Term ribbon
A single horizontal stripe spanning the full term. One thin vertical tick per vote, in chronological order, colored by the MP's choice. **Defections are taller ticks**, so abweichend votes literally stick out of the ribbon. Below the ribbon, year labels.

### Strata 2: Topic galaxy
A horizontal stacked bar of all votes, segmented by `topic`, sized by count, colored by **defection rate within that topic**. Hover any segment → tooltip with topic name + n votes + n defections. Tap → filters the list below.

### Strata 3: Filtered list
The list keeps current FilterPills (Linie, Stimme) plus the implicit topic filter from the galaxy. Rows are one-liners with a colored left **square** (4×16px) encoding choice, a tiny "ABW" dot if defected, and the chamber outcome as a faint trailing chip.

### Desktop

```
┌────────────────────────────────────────────────────────────────┐
│ ABSTIMMUNGEN · WP21                                            │
│                                                                │
│ Term ribbon                                                    │
│ ┃ ┃ ║ ┃┃ ┃┃ ║ ┃ ┃┃┃ ║┃ ┃ ┃ ║┃┃ ┃┃ ┃ ║┃┃ ┃ ║ ┃┃ ┃ ┃┃┃ ║┃ ┃     │
│   2022           2023            2024            2025          │
│   ▓ Ja  ▒ Nein  ░ Enthalten   ║ = abweichend (taller tick)     │
│                                                                │
│ Topics            (Farbe = Abweichungsquote in dieser Kategorie)│
│ ┌──────────┬─────────┬────────┬───────┬───────┬────────────┐   │
│ │Soziales  │Energie  │Verteid.│Verkehr│Inneres│Sonstiges   │   │
│ │  87      │  64     │  41    │  28   │  19   │   54       │   │
│ │ 2 abw    │ 9 abw   │ 0 abw  │ 1 abw │ 0 abw │  3 abw     │   │
│ └──────────┴─────────┴────────┴───────┴───────┴────────────┘   │
│                                                                │
│ ⌕ Filter  [Linie ▾]  [Stimme ▾]   [Energie ✕]      293 votes  │
│ ──────────────────────────────────────────────────────────     │
│ ▓  Heizungsgesetz Änderungsantrag                              │
│    14.06.24 · Energie                       abgelehnt          │
│ ──────────────────────────────────────────────────────────     │
│ ▓ • Bürgergeld Reform Drittes Gesetz zur Änderung des SGB II   │
│    22.03.24 · Soziales · ABW                angenommen         │
│ ──────────────────────────────────────────────────────────     │
│ ░  Wehrpflicht Wiedereinführung                                │
│    08.02.24 · Verteidigung                  angenommen         │
└────────────────────────────────────────────────────────────────┘
```

Choice color: Ja = `--color-success`, Nein = `--color-danger`, Enthalten = fg @ opacity-m, Nicht abgegeben = fg @ opacity-s.
Topic segment fill: fg @ opacity-s for 0% defection → ramps to `--color-danger` for >15% defection. Width = `count / total`.
Ribbon ticks: 1.5px wide, 12px tall normal, 20px tall + danger color when `defected = true`.

### Phone (≤ 420px)

Ribbon stays full-width (it's the whole point). Topic galaxy collapses to a vertical stacked bar (same colors, labels right of bar). List stays one row per vote, choice square shrinks to 3×12.

```
┌──────────────────────────────┐
│ ABSTIMMUNGEN · WP21          │
│                              │
│ ┃║┃┃ ║┃ ┃║┃┃┃ ║┃ ┃║┃┃ ║┃     │
│ 22   23   24   25            │
│                              │
│ Soziales    87  ░░░░░░░░ 2   │
│ Energie     64  ▓▓▓▓▓▓░░ 9   │
│ Verteid.    41  ░░░░░░░░ 0   │
│ Verkehr     28  ░░░░░░░░ 1   │
│ Inneres     19  ░░░░░░░░ 0   │
│ Sonstiges   54  ░░░▓░░░░ 3   │
│                              │
│ ⌕ [Linie ▾] [Stimme ▾]       │
│ ──────────────────────────── │
│ ▓ Heizungsgesetz Änd.        │
│   14.06.24 · Energie         │
│   abgelehnt                  │
│ ──────────────────────────── │
│ ▓•Bürgergeld Reform: Drit…  │
│   22.03.24 · Soziales · ABW  │
│   angenommen                 │
└──────────────────────────────┘
```

### Filters / interactions
- Term ribbon: hover/tap a tick → tooltip (date + title + choice). Drag-select a range → filters list.
- Topic galaxy: tap segment → filters list to that topic; second tap clears.
- Existing FilterPills (Linie, Stimme) sit above list; chips show active topic filter from galaxy.

### What it emphasizes at a glance
You see her **loyalty pattern across the term in one stripe** (where the taller red ticks cluster), and **which policy areas she breaks on** (Energie segment glowing red). The list is supporting evidence, not the headline.

### Rationale
This is the only option that answers the journalist's question (*when and on what does she break?*) without reading rows. It mirrors the chart-driven idiom of the party detail page (stat pies, alignment bars) rather than the list idiom of votes/list, which is the right reference because *we are summarizing one person*, not browsing many votes.

---

## Option 2: **Choice waffle by quarter**

Drop the list as the primary view. Replace it with a calendar-style waffle: one square per vote, arranged left-to-right by date, wrapped into rows of ~20. Color = choice. Defected squares get a black hairline outline. Tap any square to open a detail strip below.

### Desktop

```
┌────────────────────────────────────────────────────────────────┐
│ ABSTIMMUNGEN · 293 in WP21                                     │
│                                                                │
│ 2022 Q4 ▓▓▓▓░▓▓▒▓▓                                             │
│ 2023 Q1 ▓▓▒▒▓▓░░▓▓▓▒▓▓▓▓▓▓▓▓                                   │
│ 2023 Q2 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                                   │
│ 2023 Q3 ▒▒▒▓▓▓▓▓▓▒▒▒▓▓▓▓▓▒▓▓                                   │
│ 2023 Q4 ▓▓▓▓▓▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓                                   │
│ 2024 Q1 ▓▓▓░▓▓▓▓⟦▓⟧▓▓▓▓▒▒▓▓▓                ⟦⟧ = abweichend    │
│ 2024 Q2 ▓▓⟦▓⟧▓▓▓▒▓▓▓▓▓▓▓▓▓▓                                    │
│ 2024 Q3 ▓▓▓▓▓▒▒▓▓▓▓▓▓▒▓▓▓▓▓▓                                   │
│                                                                │
│ ▓ Ja 218 · ▒ Nein 41 · ░ Enth. 12 · ▢ Nicht 22 · ⟦⟧ Abw 4      │
│                                                                │
│ ⌕ Tap eine Kachel für Details                                  │
│ ┌──────────────────────────────────────────────────┐           │
│ │ Bürgergeld Reform: Drittes Gesetz zur Änderung… │           │
│ │ 22.03.2024 · Soziales · ANGENOMMEN               │           │
│ │ Stimme: Ja  ·  ABWEICHEND von Fraktion           │           │
│ └──────────────────────────────────────────────────┘           │
└────────────────────────────────────────────────────────────────┘
```

### Phone

```
┌──────────────────────────────┐
│ ABSTIMMUNGEN · 293           │
│                              │
│ 22Q4 ▓▓▓▓░▓▓▒▓▓              │
│ 23Q1 ▓▓▒▒▓▓░░▓▓▓▒▓▓▓▓▓▓▓     │
│ 23Q2 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓     │
│ 23Q3 ▒▒▒▓▓▓▓▓▓▒▒▒▓▓▓▓▓▒▓     │
│ 24Q1 ▓▓▓░▓▓▓⟦▓⟧▓▓▓▓▒▒▓▓▓     │
│                              │
│ ▓Ja 218 ▒Nein 41 ░Enth 12    │
│ ▢Nicht 22  ⟦⟧Abw 4           │
│                              │
│ ┌──────────────────────────┐ │
│ │ Bürgergeld Reform: Drit…│ │
│ │ 22.03.24 · Soziales      │ │
│ │ Ja · ABW · angenommen    │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### Filters / interactions
- Tap a square → reveals detail card below; second tap clears.
- FilterPills (Linie, Stimme) recolor or dim the waffle in place. Non-matching squares fade to opacity-s.
- Optional: hover row label "2024 Q1" → all other quarters dim.

### What it emphasizes at a glance
**Volume and rhythm.** You see this MP voted ~20 times in Q2 2023 (busy session) versus 5 times in summer. Streaks of identical color reveal months of party-line discipline; a sudden run of red squares is a phase of rebellion.

### Rationale
Beautiful, dense, scannable. Closest to GitHub's contribution graph, instantly familiar. Downside: hard to find a *specific* vote by title without scrolling the detail card. Best for analytic browsing, weaker for "show me that one vote I read about."

---

## Option 3: **Topic-grouped card list (hybrid)**

Keep a list shape, but group rows by `topic` with a header per group that summarizes choice mix and defection count via a mini stacked bar. Inside each group, rows are slim cards (mirroring votes/list's card-row idiom but compressed). This is the most conservative of the three.

### Desktop

```
┌────────────────────────────────────────────────────────────────┐
│ ABSTIMMUNGEN                                                   │
│ ⌕ Filter [Linie ▾] [Stimme ▾]                      293 votes   │
│                                                                │
│ ▼ ENERGIE · KLIMA                                       64 ··  │
│    Stimmen: ▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒░░  ·  9 Abweichungen ⚑           │
│    ─────────────────────────────────────────────────────       │
│    14.06.24  Heizungsgesetz Änderungsantrag                    │
│              Nein · Linie · abgelehnt                          │
│    ─────────────────────────────────────────────────────       │
│    11.05.24  Strompreisbremse Verlängerung           ⚑ ABW     │
│              Ja · angenommen                                   │
│    ─────────────────────────────────────────────────────       │
│              …weitere 62                                       │
│                                                                │
│ ▼ SOZIALES                                              87 ··  │
│    Stimmen: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒░░░  ·  2 Abweichungen ⚑          │
│    ─────────────────────────────────────────────────────       │
│    22.03.24  Bürgergeld Reform Drittes Gesetz   ⚑ ABW          │
│              Ja · angenommen                                   │
│    …                                                           │
│                                                                │
│ ▶ VERTEIDIGUNG                                          41 ··  │
│ ▶ VERKEHR                                               28 ··  │
│ ▶ INNERES                                               19 ··  │
│ ▶ SONSTIGES                                             54 ··  │
└────────────────────────────────────────────────────────────────┘
```

### Phone

Same structure, groups collapse by default except the first; mini bar stays full-width inside group header.

### Filters / interactions
- Group headers toggle expand/collapse. Default: largest group open, others collapsed.
- Filters apply within groups; group count updates.
- Tap "⚑ ABW" chip → filters to defections across all groups.

### What it emphasizes at a glance
**Thematic load and topical loyalty.** You can scan the group bars to compare how this MP votes Ja vs Nein across policy areas, and see which area harbors her defections. Less time-aware than Option 1 (no chronology) but more findable than Option 2.

### Rationale
Safe middle ground. It's the existing party-detail's `AlignmentList` idiom turned inward. Pick this if the user wants minimal change to the underlying list semantics, but it loses the "when did she break?" axis entirely. Topic isn't always populated, so an "Ohne Kategorie" group will appear.

---

## Tokens

| Token | Used for |
|---|---|
| Text xl/22 | (none, page h1 lives outside tab) |
| Text l/16 | row title |
| Text m/14 | meta line, group header label |
| Text s/12 | uppercase 0.08em section captions, year/quarter labels, chip text |
| Weight semibold | row title, group header label, status word |
| Weight regular | all body |
| Spacing xs/4 | ribbon tick gap, waffle cell gap, dot/chip pad |
| Spacing s/8 | meta gap, filter pill row |
| Spacing m/12 | row vertical pad, between strata |
| Spacing l/16 | between header strata and list, between groups |
| Spacing xl/24 | top/bottom of tab |
| Opacity s/0.15 | borders, ribbon background track, empty topic segment |
| Opacity m/0.4 | inactive choice fill, dim non-matching waffle cells |
| Opacity l/0.7 | meta text, year labels |
| Color success | Ja choice, success outcomes, low-defection topic segments |
| Color danger | high-defection topic fill, abweichend tick, ABW chip |
| Color fg | neutral text, Enthalten fill |
| Components | FilterPill (kept), Badge (ABW chip, topic chip), Tooltip (ribbon tick, topic segment), Skeleton (load state) |
| Components not used | Table (replaced), Card (no chrome, borders only), Select (FilterPill covers) |

## Recommendation

**Option 1.** It's the only one that respects the user's stated criterion: the list should *tell the story before you read it*. Ribbon answers "when," topic galaxy answers "on what," list is evidence. Option 2 is the most beautiful but weakest for findability. Option 3 is safe but loses chronology, which is half the value of an MP's record.
