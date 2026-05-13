# Member detail — Anfragen tab

Route: `/members/$id` (Anfragen tab)
Width target: max-w-3xl (mobile portrait ~52ch)

---

## The problem with today

```
ANFRAGE                            DATUM     TYP   STATUS
─────────────────────────────────────────────────────────────
Förderung E-Mobilität Werkstätten 12.04.24   KL    Beantwortet
Lieferkettengesetz Evaluierung    03.03.24   GR    Offen
Pestizid-Grenzwerte Trinkwasser   24.02.24   SF    Beantwortet
…(50 more)
```

Same table problem as Abstimmungen. Worse: the most interesting axis — **which ministries does this MP grill?** — is buried in a small grey ressort label. And the binary "answered vs vanished into the bureaucracy" outcome is hidden in a text cell.

Story we're missing:
- *Which ministries does she go after?* (`answerRessort`)
- *Do her questions get answered, or do they stall?* (`beratungsstand`)
- *Does she lead questions or co-sign others'?* (`cosignerCount`)
- *Does she favor kleine, große, or schriftliche Anfragen?* (`type`)

Three directions, ordered by recommendation.

---

## Option 1 (recommended) — **Ministry constellation + answered bar**

Top: a single horizontal stacked bar where each segment is a Ressort, width = count of Anfragen to that ministry, fill = answered ratio (success fills from left to right within each segment). Tap a segment to filter the list. Above the bar, a single "Antwortquote 67%" stat in the StatPie idiom from party detail.

Below: a denser version of today's list with a **status side stripe** (4px) on each row — green for beantwortet, danger for offen — plus the ministry as a prominent chip and cosigners as a dot cluster (1 filled dot for the MP herself, up to 5 faded dots for cosigners, "+N" overflow).

### Desktop

```
┌────────────────────────────────────────────────────────────────┐
│ ANFRAGEN · 47 in WP21                                          │
│                                                                │
│   ┌───────────────────┐                                        │
│   │  ╱─────╲          │  Antwortquote                          │
│   │ │  67%  │         │  31 von 47 beantwortet                 │
│   │  ╲─────╱          │  ⌀ 38 Tage bis Antwort                 │
│   └───────────────────┘                                        │
│                                                                │
│ RESSORTS                                                       │
│ ┌─────────────┬────────┬──────┬───────┬──────┬──────────┐      │
│ │BMWK     12  │BMAS  9 │BMUV 7│BMVg  5│BMI 4 │Andere 10 │      │
│ │▓▓▓▓▓▓▓▓░░░░│▓▓▓▓▓▒▒▒│▓▓▓▓▒│▓▓░░░  │▓▓▒▒  │▓▓▓▓▓▒▒▒░░│      │
│ │ 8/12       │ 5/9    │ 5/7  │ 2/5   │ 2/4  │ 6/10     │      │
│ └─────────────┴────────┴──────┴───────┴──────┴──────────┘      │
│  (Segmentbreite = Anzahl, Füllung = Antwortquote)              │
│                                                                │
│ ⌕ Anfragen suchen…                                             │
│ ⌕ Filter  [Typ ▾]  [Status ▾]  [BMWK ✕]              12 Anfr.  │
│                                                                │
│ ┃ ┌──────────────────────────────────────────────┐             │
│ ┃ │ BMWK · Wirtschaft und Klimaschutz   KL 12.04 │             │
│ ┃ │ Förderung E-Mobilität in Werkstätten         │             │
│ ┃ │ ● · · · ·   alleine                          │             │
│ ┃ │                              BEANTWORTET 18T │             │
│ ┃ └──────────────────────────────────────────────┘             │
│ ┃ ┌──────────────────────────────────────────────┐             │
│ ┃ │ BMAS · Arbeit und Soziales         GR  03.03 │             │
│ ┃ │ Lieferkettengesetz Evaluierung und Umsetzung │             │
│ ┃ │ ● • • • •  +7 Mitzeichner                    │             │
│ ┃ │                                   OFFEN 71T  │             │
│ ┃ └──────────────────────────────────────────────┘             │
│ ┃ ┌──────────────────────────────────────────────┐             │
│ ┃ │ BMUV · Umwelt                       SF 24.02 │             │
│ ┃ │ Pestizid-Grenzwerte in Trinkwasserschutzzonen│             │
│ ┃ │ ● · · · ·   alleine                          │             │
│ ┃ │                               BEANTWORTET 9T │             │
│ ┃ └──────────────────────────────────────────────┘             │
└────────────────────────────────────────────────────────────────┘
```

Left stripe ┃: 4px wide, `--color-success` for beantwortet, `--color-danger` for offen. Stripe runs the full card height.
Ministry chip: fg @ opacity-s background, fg text. No party color here.
Ressort bar segments: fg @ opacity-s track, `--color-success` fill = answered ratio.
Dot cluster: filled dot (●) = MP herself, hollow (•) = each cosigner up to 5, "+N" overflow. "alleine" label when 0 cosigners.
Days suffix (18T, 71T): time to answer if beantwortet, time pending if offen.

### Phone

StatPie + ressort bar stack vertically. Ressort bar becomes vertical (like Anfragen option B in old mock). Cards stay single column.

```
┌──────────────────────────────┐
│ ANFRAGEN · 47                │
│                              │
│    ╱──╲   Antwortquote       │
│   │67%│   31 / 47            │
│    ╲──╱   ⌀ 38 Tage          │
│                              │
│ RESSORTS                     │
│ BMWK   12  ▓▓▓▓▓▓▓░░ 8/12    │
│ BMAS    9  ▓▓▓▓▓▒▒▒  5/9     │
│ BMUV    7  ▓▓▓▓▓▒▒   5/7     │
│ BMVg    5  ▓▓░░░     2/5     │
│ BMI     4  ▓▓▒▒      2/4     │
│ Andere 10  ▓▓▓▓▓▒▒░░ 6/10    │
│                              │
│ ⌕ suchen…                    │
│ [Typ ▾] [Status ▾] [BMWK ✕]  │
│                              │
│ ┃┌────────────────────────┐  │
│ ┃│ BMWK         KL  12.04 │  │
│ ┃│ Förderung E-Mobilität  │  │
│ ┃│ in Werkstätten         │  │
│ ┃│ ● · · · ·  alleine     │  │
│ ┃│        BEANTWORTET 18T │  │
│ ┃└────────────────────────┘  │
│ ┃┌────────────────────────┐  │
│ ┃│ BMAS         GR  03.03 │  │
│ ┃│ Lieferkettengesetz…    │  │
│ ┃│ ● • • • • +7           │  │
│ ┃│             OFFEN 71T  │  │
│ ┃└────────────────────────┘  │
└──────────────────────────────┘
```

### Filters / interactions
- Tap ressort segment → filters list to that ministry. Chip appears in filter row.
- StatPie is read-only (summary).
- Existing search box, Typ/Status FilterPills retained.
- Tap dot cluster → tooltip lists cosigner names.

### What it emphasizes at a glance
**Who she goes after and whether the government answers.** You see Wirtschaftsministerium is her main target (widest segment), and that Verteidigung mostly ignores her (BMVg bar is half empty). The stripe column tells you stalls vs answers without reading.

### Rationale
Mirrors the party detail page exactly: stat pie + horizontal stacked bar + filterable list. Reuses idioms the user already endorsed. The ressort bar is the single most useful chart for an Anfragen list because it answers the "what does she focus on" question and acts as a filter — two jobs in one component.

---

## Option 2 — **Ministry constellation (bubbles)**

A 2D layout: each Ressort is a bubble, sized by Anfragen count, filled by answered ratio. Bubbles cluster naturally; the biggest is your headline target. Below: a slim list, default unfiltered.

### Desktop

```
┌────────────────────────────────────────────────────────────────┐
│ ANFRAGEN · 47                                                  │
│                                                                │
│            ╭─────────╮                                         │
│            │  ▓▓▓▓░  │  BMWK                                   │
│            │  ▓▓▓▓░  │  12 · 67%                               │
│            │  ▓▓▓░░  │                                         │
│            ╰─────────╯                                         │
│                                                                │
│        ╭───────╮       ╭───────╮                               │
│        │ ▓▓▒▒▒ │       │ ▓▓▓▒░ │                               │
│        │ BMAS  │       │ BMUV  │                               │
│        │  9    │       │  7    │                               │
│        ╰───────╯       ╰───────╯                               │
│                                                                │
│      ╭─────╮   ╭─────╮          ╭───────╮                      │
│      │ ▓░░ │   │ ▓▒▒ │          │ Andere│                      │
│      │BMVg │   │ BMI │          │  10   │                      │
│      │  5  │   │  4  │          ╰───────╯                      │
│      ╰─────╯   ╰─────╯                                         │
│                                                                │
│ ⌕ Filter  [Typ ▾]  [Status ▾]                       47 Anfr.   │
│  …list rows follow, similar to Option 1 cards…                 │
└────────────────────────────────────────────────────────────────┘
```

Bubble size: sqrt-scaled count. Fill: pixel waffle inside the bubble = answered ratio.

### Phone

Bubbles don't scale to 52ch — they degrade to the same vertical Ressort bar as Option 1 phone view. So on mobile Option 2 ≈ Option 1.

### Filters / interactions
- Tap bubble → filters list, chip appears, other bubbles dim.
- Same Typ/Status filters and list rows as Option 1.

### What it emphasizes at a glance
**One ministry visibly dominates.** A constellation makes the "she's a BMWK specialist" story unmissable in a way a bar can't, because area-as-count is more visceral than width-as-count.

### Rationale
More poetic, less efficient. Bubbles waste vertical real estate and collapse to a bar on phones anyway, so you're paying complexity for a desktop-only flourish. Useful only if we expect the MP detail page to be mostly viewed on desktop — which is unlikely for a public transparency tool.

---

## Option 3 — **Status timeline by quarter**

Drop ministry as primary. Instead, lay out Anfragen along a vertical timeline grouped by quarter. Each Anfrage is a card with a status dot on the timeline. Color = answered/offen. The eye sees clusters of activity and stalled questions piling up in recent quarters.

### Desktop

```
┌────────────────────────────────────────────────────────────────┐
│ ANFRAGEN · 47                                                  │
│ ⌕ Filter  [Typ ▾]  [Status ▾]  [Ressort ▾]                     │
│                                                                │
│  2024 Q2                                                       │
│   ●─── Förderung E-Mobilität in Werkstätten                    │
│   │    BMWK · KL · 12.04.24 · BEANTWORTET 18T                  │
│   │                                                            │
│   ●─── Netzentgelte für Großspeicher                           │
│   │    BMWK · KL · 08.04.24 · BEANTWORTET 22T                  │
│   │                                                            │
│  2024 Q1                                                       │
│   ●─── Lieferkettengesetz Evaluierung und Umsetzung            │
│   │    BMAS · GR · 03.03.24 · OFFEN 71T            ⚑           │
│   │                                                            │
│   ●─── Pestizid-Grenzwerte Trinkwasser                         │
│   │    BMUV · SF · 24.02.24 · BEANTWORTET 9T                   │
│   │                                                            │
│  2023 Q4                                                       │
│   …                                                            │
└────────────────────────────────────────────────────────────────┘
```

### Phone

Same structure, single column. Dot+line column stays.

### Filters / interactions
- Standard filter pills.
- Tap dot → opens the PDF link.
- Quarter headers are sticky on scroll.

### What it emphasizes at a glance
**Activity rhythm and pending pile.** You see when she went on an Anfrage spree and which ones are still rotting unanswered. But it buries the ministry angle, which is arguably the more useful axis.

### Rationale
Useful if "when" matters more than "where." For Anfragen specifically, I don't think it does — Anfragen are slow-moving compared to votes, and the ministry-targeting is the real political signal. Include for completeness.

---

## Tokens

| Token | Used for |
|---|---|
| Text xl/22 | StatPie percentage inside disc |
| Text l/16 | row title |
| Text m/14 | meta line, dot cluster legend |
| Text s/12 | uppercase 0.08em section captions, chip text, ressort label, status word |
| Weight semibold | row title, ministry chip, status word, StatPie value |
| Weight regular | all body |
| Spacing xs/4 | dot cluster gap, chip internal pad |
| Spacing s/8 | meta gap, filter pill row, between dot cluster and status |
| Spacing m/12 | card vertical pad, between strata, between cards |
| Spacing l/16 | between header strata and filter row, ressort bar height (h-8 ≈ 32) |
| Spacing xl/24 | tab vertical padding |
| Opacity s/0.15 | borders, ressort bar track, hollow cosigner dots |
| Opacity m/0.4 | dimmed bubble in non-selected state |
| Opacity l/0.7 | meta text (ministry name in chip secondary), days suffix |
| Color success | beantwortet stripe, beantwortet status word, ressort segment fill, StatPie fill |
| Color danger | offen stripe, offen status word, ⚑ flag |
| Color fg | neutral text, ministry chip text, filled MP-self dot |
| Components | Card (slim card per row), Badge (ministry chip, status), Tooltip (dot cluster, ressort segment), Input (search), FilterPill (kept), Skeleton |
| Components not used | Table (replaced), Tabs (parent stays), Select (FilterPill covers) |

## Recommendation

**Option 1.** Mirrors the party-detail's chart-plus-list shape that already works in this app, surfaces the two most-asked questions (which ministries, what answer rate), and the side stripe + dot cluster on each row makes the list itself dense without being a table. Option 2's bubbles are charming but collapse on mobile. Option 3 picks the wrong axis for this data type.

Consider shipping Option 1 first; if data later shows users want chronology (e.g. for press cycles), add a quarter-grouped view as a toggle on top of the same list.
