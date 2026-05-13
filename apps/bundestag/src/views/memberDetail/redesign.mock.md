# Member detail — Abstimmungen + Anfragen redesign

Route: `/members/:id` (Abstimmungen tab, Anfragen tab)
Width target: ~52ch (mobile portrait, max-w-3xl)

---

## Current state (for reference)

Both tabs are 4-column grids with text-only cells. Glanceability is near zero — the eye scans down the title column and has to translate "Ja / Linie" into meaning.

```
ABSTIMMUNG                         DATUM     STIMME    LINIE
─────────────────────────────────────────────────────────────
Heizungsgesetz Änderungsantrag    14.06.24   Nein      Linie
Bürgergeld Reform                 22.03.24   Ja        Abw
Wehrpflicht Wiedereinführung      08.02.24   Enthalten Linie
```

```
ANFRAGE                            DATUM     TYP   STATUS
─────────────────────────────────────────────────────────────
Förderung E-Mobilität Werkstätten 12.04.24   KL    Beantwortet
Lieferkettengesetz Evaluierung    03.03.24   GR    Offen
```

The data has more story than these tables show. Specifically:

| Tab | Untapped signal |
|---|---|
| Abstimmungen | `result` (chamber passed/failed) → can show "voted Yes, chamber rejected" mismatch |
| Abstimmungen | `defected` is a boolean per row but reads as text — should be visual |
| Anfragen | `answerRessort` clusters by ministry — currently buried as small grey text |
| Anfragen | `cosignerCount` is hidden in "+3 Mitzeichner" — could be a dot cluster |
| Anfragen | answered vs offen is binary, perfect for a side stripe |

---

## Abstimmungen — Option A: Alignment matrix

Each row is split into a title block plus a tight **2×2 alignment grid** on the right. The grid encodes the two booleans the user actually cares about: *did I vote with my party?* (row 1) and *did my side win the chamber?* (row 2). One filled square = aligned, empty square = broke from / lost.

```
┌──────────────────────────────────────────────────┐
│ 14.06.2024 · NAMENTLICH                          │
│ Heizungsgesetz Änderungsantrag                   │
│ Stimme: Nein                          [■] Linie  │
│                                       [■] Mehrh. │
├──────────────────────────────────────────────────┤
│ 22.03.2024 · NAMENTLICH                          │
│ Bürgergeld Reform — Drittes Gesetz zur           │
│ Änderung des Zweiten Sozialgesetzbuches          │
│ Stimme: Ja                            [□] Linie  │
│                                       [■] Mehrh. │
├──────────────────────────────────────────────────┤
│ 08.02.2024 · NAMENTLICH                          │
│ Wehrpflicht Wiedereinführung                     │
│ Stimme: Enthalten                     [■] Linie  │
│                                       [□] Mehrh. │
└──────────────────────────────────────────────────┘
```

Square legend at top of tab once:
`[■] mit Fraktion / Mehrheit   [□] dagegen`

Filled square = `var(--color-success)` filled. Empty square = fg @ opacity-s outline. Defected rows naturally show one open square, which scans instantly.

**Tradeoffs**
- Glanceability: very high — eye learns the 2×2 pattern after 3 rows, scans for `[□]` to find anomalies
- Info density: high (4 facts per row) without text bloat
- Build: trivial, two divs

---

## Abstimmungen — Option B: Outcome stripe

A 4-cell horizontal stamp strip across the top of each row encodes (vote choice / party line / chamber result / personal-vs-chamber). The title sits below. The colored stamps make defections and "I voted for it but it failed" rows visually pop without a legend lookup.

```
┌──────────────────────────────────────────────────┐
│ ┃NEIN ┃ LINIE  ┃ ABGELEHNT ┃ ✓ mit Mehrheit       │
│ Heizungsgesetz Änderungsantrag                   │
│ 14.06.2024 · BMWK                                │
├──────────────────────────────────────────────────┤
│ ┃ JA  ┃ ABW    ┃ ANGENOMMEN┃ ✓ mit Mehrheit       │
│ Bürgergeld Reform — Drittes Gesetz zur Änderung  │
│ 22.03.2024 · BMAS                                │
├──────────────────────────────────────────────────┤
│ ┃ENTH ┃ LINIE  ┃ ANGENOMMEN┃ ✗ gegen Mehrheit     │
│ Wehrpflicht Wiedereinführung                     │
│ 08.02.2024 · BMVg                                │
└──────────────────────────────────────────────────┘
```

Color rules: choice stamp uses fg (neutral). Linie stamp uses fg @ opacity-m; **ABW uses `--color-danger`**. Result stamp uses success/danger. "mit/gegen Mehrheit" uses success/danger.

**Tradeoffs**
- Glanceability: high — colored stripe is the first thing the eye lands on
- Info density: highest of the three (5 facts) but risks looking busy on small screens
- Build: medium — needs a `Stamp` variant set similar to `votesList/Stamp.tsx`

---

## Abstimmungen — Option C: Donut-mini row (mirrors votes/list)

Directly mirrors the votes/list idiom the user already endorsed: a small VoteDistributionDonut on the left, title + meta on the right. The MP's own slice is **outlined** in the donut so you can see how she voted within the chamber distribution. Defected rows get a single `ABWEICHLER` chip below the title.

```
┌──────────────────────────────────────────────────┐
│  ╭─╮                                              │
│ │░▓│ Heizungsgesetz Änderungsantrag              │
│  ╰─╯ 14.06.2024 · Abgelehnt                      │
│      Stimme: Nein  ·  mit Fraktion               │
├──────────────────────────────────────────────────┤
│  ╭─╮                                              │
│ │█░│ Bürgergeld Reform — Drittes Gesetz zur      │
│  ╰─╯ Änderung des Zweiten Sozialgesetzbuches     │
│      22.03.2024 · Angenommen                     │
│      Stimme: Ja  ·  [ABWEICHLER]                 │
├──────────────────────────────────────────────────┤
│  ╭─╮                                              │
│ │░█│ Wehrpflicht Wiedereinführung                │
│  ╰─╯ 08.02.2024 · Angenommen                     │
│      Stimme: Enthalten · mit Fraktion            │
└──────────────────────────────────────────────────┘
```

Donut size 48–56px. MP's own choice = brighter slice or 2px fg outline on her wedge.

**Tradeoffs**
- Glanceability: medium-high — donuts give chamber-result intuition immediately, but personal vote needs a second read
- Info density: medium
- Build: highest — reuses VoteDistributionDonut but needs a "highlight slice" mode + per-row data hit. List of 600+ rows = 600 donuts. Probably needs virtualization

---

## Anfragen — Option A: Status-stripe cards with ministry chip

Each row gets a **4px left stripe** colored by status (green = beantwortet, red = offen) — like a Gmail unread indicator. The ministry becomes a prominent chip (it's the only consistent grouping signal). Cosigners become a dot cluster: up to 5 dots + "+N" if more, so "I led this" vs "I tagged along on 12 others' query" is instantly visible.

```
┃ [BMWK · Wirtschaft]               KL · 12.04.2024 │
┃ Förderung E-Mobilität in Werkstätten              │
┃ • · · · ·  +0          BEANTWORTET                │
┠──────────────────────────────────────────────────┤
┃ [BMAS · Arbeit]                   GR · 03.03.2024 │
┃ Lieferkettengesetz Evaluierung und Umsetzung     │
┃ • • • • •  +7          OFFEN                      │
┠──────────────────────────────────────────────────┤
┃ [BMUV · Umwelt]                   SF · 24.02.2024 │
┃ Pestizid-Grenzwerte in Trinkwasserschutzzonen    │
┃ • · · · ·  +0          BEANTWORTET                │
```

Stripe: 4px wide, full row height, `--color-success` if beantwortet else `--color-danger` @ opacity-m. Ministry chip = neutral fg @ opacity-s background. Dot cluster: filled dot = the MP, faded dots = cosigners. Status word right-aligned, same color family as the stripe.

**Tradeoffs**
- Glanceability: very high — open queries jump out via the red stripe column
- Info density: high; the dot cluster replaces "+3 Mitzeichner" text with something scannable
- Build: easy — one extra `border-l-4` and a small dot component

---

## Anfragen — Option B: Ministry-grouped with sparkline header

Drops the flat list in favor of **grouping by Ressort** (the field with the most consistent signal). Each group has a header showing count + answered ratio as a tiny inline bar. Rows underneath are slim. Filters fold/unfold groups. This tells a different story: "this MP hammers BMWK relentlessly, half answered."

```
▼ BMWK · Wirtschaft und Klimaschutz       12 Anfragen
  ████████░░░░  8/12 beantwortet
  ────────────────────────────────────────────────
  12.04.24  KL  Förderung E-Mobilität Werks…   ✓
  08.04.24  KL  Netzentgelte für Speicher       ✓
  22.03.24  GR  Strompreisbremse Evaluation     ✗
  …weitere 9

▶ BMAS · Arbeit und Soziales              7 Anfragen
  █████░░░░░░░  3/7 beantwortet

▶ BMUV · Umwelt                           5 Anfragen
  ████░░░░░░░░  2/5 beantwortet

▶ Ohne Ressort                            3 Anfragen
```

Header bar = `--color-success` segment over fg @ opacity-s track, h-1 (4px). Collapsed groups are one line each. ✓/✗ at row-end uses success/danger.

**Tradeoffs**
- Glanceability: highest **for the meta-question** ("what does this MP focus on?"); lower for finding a specific query
- Info density: very high at the group level, low at the row level
- Build: medium — already have `data.groups` server-side (currently by Sachgebiet, would need a parallel grouping by Ressort or swap)
- Filters: type/status filters still work inside expanded groups; Ressort filter becomes redundant (the headers ARE the filter)

---

## Recommendation

**Abstimmungen → Option A (Alignment matrix).** It's the only option that visually answers the question that makes an MP's voting record interesting: *when did she break from the line, and when did her side lose?* Two filled/empty squares per row, learned in seconds, scan-friendly on mobile. Option C is seductive because it mirrors the votes/list look, but rendering 600 donuts is overkill and the personal-vote slice is hard to read at 48px. Option B is information-rich but the colored stripe risks looking like a casino on a long list.

**Anfragen → Option A (Status-stripe cards).** The Gmail-style left stripe gives instant answered/offen scannability — which is the single most useful filter for an Anfragen list — without spending a column on it. Ministry as a chip and cosigners as a dot cluster surface signals that are currently invisible. Option B (ministry grouping) is genuinely better for the *analytic* question "what does this MP focus on?", but worse for browsing, and that meta-question arguably belongs in a separate summary block at the top of the tab rather than as the list structure itself. Consider doing both: **A as the list + a small ministry-bar summary above it** lifted from Option B's headers.

---

## Tokens

| Token | Used for |
|---|---|
| Text xxl/24 | (none — page h1 lives outside the tab) |
| Text l/16 | row title |
| Text m/14 | row body, group labels |
| Text s/12 | meta line (date · type · ministry), uppercase 0.08em for section captions |
| Weight semibold | row title, status word |
| Weight regular | everything else |
| Spacing xs/4 | dot cluster gap, stamp internal pad |
| Spacing s/8 | within-row gap |
| Spacing m/12 | row vertical pad |
| Spacing l/16 | between filter row and list |
| Opacity s/0.15 | borders, track of sparkline, empty alignment square |
| Opacity m/0.4 | ministry chip bg fill |
| Opacity l/0.7 | meta text, group header counts |
| Color success | filled alignment square, beantwortet stripe + word, sparkline fill, ✓ |
| Color danger | offen stripe + word, ABW chip, ✗ |
| Color fg | neutral text, choice stamp |
| Components | Badge (ministry chip, ABW chip), Tooltip (legend, dot cluster expand) |
| Components not used | Table (replaced), Tabs (parent stays), Card (no chrome — borders only) |
