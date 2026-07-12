# /votes

Definitive spec after plan 102 phases 1-3. Winner of the three-direction prototype round
plus the hybrid iteration; reference prototype at `/tmp/votes-directions/hybrid.html`
(V3 cards), screenshots `hybrid-v2-card3.png`, `hybrid-desktop.png`. Supersedes the
5-round list idiom entirely: no hero, no duel-bar rows, no surface day bands on mobile.

Two layouts, one breakpoint at **700px**. Mobile is a TikTok-style snap feed of bounded
cards with a floating filter button + bottom sheet (user amendments 14+15); desktop is
a newspaper-lead ledger with the existing FilterPillRow + FilterPill sticky under the
app nav.

Mobile filters (amendments 14+15): no pill row. A floating pill-shaped button, bottom
center, safe-area aware, `fg` fill with `background` text (inverted so it pops over the
feed; pill shape and dark fill are deliberate exceptions to radius-0), lucide funnel
icon + localized "Filter · n" where n counts all active filter values. The default
view has no vote-type filter and reads "Filter · 0", semibold when n > 0. Tapping opens a
bottom sheet: drag handle, one caption-labeled group per filter (Typ, Antragsteller,
Ergebnis, Kategorie), options as bordered chips, selected = surface bg + semibold + ×,
applies immediately on select, tap selected again to clear, dismisses on backdrop tap
or swipe-down. Same filter state and URL semantics as the pills.

## What a citizen scans for

Mobile: one vote per screen. The chamber itself is the result: a hemicycle of 630 seat
dots, green mass vs red mass, counts flanking. Swipe = next vote.
Desktop: the SAME unframed vote surface, re-flowed wide: one vote per row with
text left (kicker, headline, summary) and the result right (hemicycle + donut row).
One ingredient set on both devices (phase 4 unification).

## Layout, mobile (< 700px, 390px is the primary artifact)

```
+------------------------------------------+
| Machtblick (app nav, sticky)          =  |
| .--------------------------------------. |
| | (SPD-logo) · 11. JUN 26  /========/  | |  <- kicker: proposer as party LOGO
| |                          |ABGELEHNT| | |     (17px, alt = party name; plain
| |                          /========/  | |     text for Bundesregierung/Länder/
| |                                      | |     Sonstige) + SHORT-month date
| |                                      | |     fg@70, text-s caps. Verdict word
| |                                      | |     is GONE from the kicker: the
| |                                      | |     rotated rubber Stamp (existing
| |                                      | |     Stamp component, size m scaled
| |                                      | |     1.15, success/danger) overlays
| |                                      | |     the top right (right-l top-l,
| |                                      | |     pointer-events none). PURE
| |                                      | |     overlay: absolutely positioned,
| |                                      | |     out of flow, kicker and title
| |                                      | |     lay out as if it did not exist
| | Jahresemissions-                     | |
| | gesamtmengen-Verordnung              | |  <- title: font-display semibold
| | 2031-2040                            | |     text-xl (22), clamp 4 lines
| |                                      | |
| |        . · * ° * · .                 | |
| |     .*°*·:::::::·*°*.                | |  <- hemicycle: 630 dots, 11 rows,
| |    :#####:::===::%%%%:               | |     2.4px dots, angle-sorted fill
| |   :######::==·==::%%%%:              | |     Ja -> Enth -> abwesend -> Nein
| |  .#######.:=:·:=:.%%%%%.             | |     (# success, = fg@40, · fg@15,
| |                                      | |      % danger)
| | JA          74 ENTHALTEN        NEIN | |
| | 303         65 ABWESEND          188 | |  <- flanking counts: font-display
| |                                      | |     semibold 32px, success/danger;
| | CDU/CSU  [############]              | |     legend centered, two stacked
| | AFD      [%%%%%%%%%%%%]              | |     lines, text-s fg@40
| | SPD      [############]              | |  <- party grid directly below the
| | GRUENE   [============]              | |     hemicycle (one result block), no
| | LINKE    [%%%%%%%%%%%%]              | |     caption; 64px name col caps
| |                                      | |     10px fg@70 + 6px mini bar of
| | Das Gesetz begrenzt die jährlichen   | |     Ja/Enth/Nein; mixed = semibold
| | Emissionsmengen für 2031-2040 und    | |
| | setzt EU-Vorgaben um.                | |  <- summary: serif text-m, markdown,
| |                                      | |     flex-1 (fills ALL remaining card
| |         ( Filter · 1 )               | |     height, fade at overflow, no
| '--------------------------------------' |     fixed clamp); floating filter
| .--------------------------------------. |     button overlays bottom center
| | ABGELEHNT · 11. JUNI 2026            | |  <- 44px peek: next card's top +
+------------------------------------------+     kicker = swipe affordance
```

Snap feed mechanics:
- No pill row on mobile (user amendment): filters live behind a floating button +
  bottom sheet (see Filters below). The feed starts directly under the app nav.
- `html { scroll-snap-type: y mandatory; scroll-padding-top: 52px }` (app nav height).
- Each feed cell: `scroll-snap-align: start; scroll-snap-stop: always;
  height: calc(100svh - 52px - 44px)`, padding `s m 0` (8px gap between cards).
- Card inside: `bg-background` (white; user rejected the surface gray), with
  no outer border or shadow. An inset `elevated` hairline separates adjacent votes,
  matching the iOS feed. The unframed content surface needs no container radius,
  uses padding l, and remains a flex
  column, overflow hidden. The 44px remainder shows the next card's top edge and kicker
  line; that peek is the only swipe indicator. No dots, no rails.
- Card links via the stretched-link idiom (absolute inset `<a>` with the full
  aria-label): the kicker's PartyBadge keeps its own party-profile link (z above the
  stretched link), so the card must NOT be a wrapping `<a>`.
- No masthead, no page h1, no search field, no day bands: the feed starts directly
  under the sticky pill row; every card carries its own date.
- The viz block gets the flex slack (`flex: 1`, content centered) so short-title cards
  breathe in the middle, not at the bottom.

Hemicycle (the V3 viz, exactly as prototyped):
- SVG ~320x165, 630 seats (totalMembers), 11 rows, dot r 2.4, row radii 54 -> 145,
  seats per row proportional to radius (largest-remainder rounding).
- All seat positions sorted by angle (desc from 180°), then filled in order:
  Ja (success) -> Enthalten (fg @ opacity-m) -> abwesend (fg @ opacity-s) -> Nein
  (danger). Ragged wedge boundaries are expected and correct (rows quantize angles
  differently); do not try to smooth them.
- Below the arc: flanking counts (JA left, NEIN right; label text-s caps fg@70 above
  a font-display semibold 32px number, success/danger; sized down from 40px per user
  amendment to free room for the summary), centered legend stacked on two lines
  ("74 Enthalten" over "65 Abwesend", no dot separator; omit the Enthalten line when
  0) text-s caps fg@40.
- `role="img"` with aria-label carrying all four counts.

Card anatomy, final (user amendments): kicker -> title -> hemicycle with flanking
counts -> party mini-bar grid (directly below the hemicycle, no caption, one grouped
result block) -> summary text. No footer row (abgegeben/abwesend and n/total removed
as redundant), no "So stimmten die Fraktionen" caption. Nothing after the summary.

Summary block: shows the vote's real generated summary (`summarySimplified`, same
field the detail page renders), now on the list payload, server-side clipped to ~300
chars at a word boundary (links flattened to their text because the card is one <a>;
bold markers kept and balanced across the clip). Rendered with the same MarkdownInline
component the detail page uses. Fallback when missing: auto-generated dek from
partySummaries:
1. Dek sentence: "Union und SPD stimmen dafür, Grüne und Linke dagegen." + "Die AfD
   enthält sich." (singular/plural verb per party; CDU/CSU reads "Union" in prose,
   "CDU/CSU" in the grid; mixed -> "stimmt uneinheitlich ab").
2. Abweichler callout when a party's off-line votes >= 3, biggest deviation only:
   "Bei der AfD weichen 10 Abgeordnete von der Fraktionslinie ab."
3. Proposer when present: "Eingebracht von der Bundesregierung." (dative article map).
Same fallback on both layouts (deriveDescription); no separate desktop dek anymore.

## Layout, desktop (>= 700px, phase 4 unified card)

Same VoteCard component as mobile, re-flowed to two columns at the desk breakpoint.
Reference prototype `/tmp/votes-directions/unify-b.html` (option B, user pick), with a
user-modified split: LEFT = everything up to and including the summary, RIGHT =
everything after, stacked.

```
| Machtblick  Abstimmungen Abgeordnete ...                                       |  <- app topbar
| v [Typ v] [Antragsteller v] [Ergebnis v] [Kategorie v]                         |  <- pill row, sticky, unchanged
|                                                                                |
| SITZUNG VOM 11. JUNI 2026                                       4 ABSTIMMUNGEN |  <- dayline: plain caption, NO rule
| .----------------------------------------------------------------------------. |
| | (logo) · 11. JUN 2026            /==========/ |      . · * ° * · .         | |  <- kicker spans the LEFT column:
| |                                  |ANGENOMMEN| |   .*°*·:::::::·*°*.        | |     proposer logo/text + short date
| |                                  /==========/ |  :#####:::===::%%%%:       | |     left, straight Stamp right
| | Jahresemissions-gesamtmengen-                 | :######::==·==::%%%%:      | |
| | Verordnung 2031-2040                          |.#######.:=:·:=:.%%%%%.     | |  <- title: font-display xl semibold
| |                                               |                            | |
| | Die Verordnung legt fest, wie viel            | JA    74 ENTHALTEN     NEIN| |  <- RIGHT column, stacked: hemicycle
| | Treibhausgas Deutschland in jedem Jahr        | 303   65 ABWESEND      188 | |     + flanking counts + two-line
| | von 2031 bis 2040 ausstoßen darf. Die         |                            | |     legend, then donut row beneath
| | erlaubten Mengen sinken gleichmäßig von       |  (O)  (O)  (O)  (O)  (O)   | |
| | **409 Millionen Tonnen** ... (markdown        | CDU  SPD  GRÜNE AFD LINKE  | |
| | summary, fitted clamp)                        |                            | |
| '----------------------------------------------------------------------------' |
|                                                                                |  <- gap l between cards
| .----------------------------------------------------------------------------. |
```

- Container centered, vote surfaces stacked vertically with an inset gray divider; natural height
  (no 100svh), height driven by the right column (~330px).
- Vote surface = the same article: white bg, no border or shadow,
  padding l. Grid `[minmax(0,1fr) | 380px]`, column-gap 48px, no column rule (the
  gap alone separates, per prototype).
- LEFT: kicker (proposer logo/text + `·` + short date left, straight Stamp size m
  right-aligned), title (xl semibold, clamp 4, hover underline 1px offset 3px),
  markdown summary (serif text-m, `summarySimplified`, fallback deriveDescription).
- RIGHT: hemicycle (320px, flanking counts 32px, two-line legend) then donut row
  beneath, constrained to the hemicycle's 320px width.
- Summary clamp: CLAMPED to the right column's height (equal columns, calm bottom
  edge), not free-flowing. Mechanics: the summary p is absolutely positioned inside
  its flex-1 container on desk so it contributes zero intrinsic height; the right
  column therefore sets the row height, useFittedLineClamp measures the leftover and
  sets -webkit-line-clamp; the pre-hydration head-stylesheet script does the same
  before React loads (one shared DOM tree per card, clamp targets found via
  `[data-clamp-summary]` and the card's own id). Short summaries end naturally
  and leave calm whitespace.
- Dayline = plain caption row (text-s caps: "Sitzung vom {date}" fg@70 left,
  "{n} Abstimmungen" fg@40 right), NO 2px rule (retired with the ledger).
- Card is one stretched link, same aria-label as mobile.
- The ledger language (LedgerRow, agate table, stat trio, dek-as-dek) is retired;
  deriveDescription survives only as the summary fallback.

## Why (decisions, do not relitigate)

- **Paged vote surface:** the fixed-height mobile surface and next-vote peek make the
  snap feed legible as swipeable content. The frame and shadow are removed in favor
  of the iOS inset divider treatment.
- **Hemicycle as the result viz:** user picked it over half-donut and margin-donut.
  It is data-honest (one dot = one seat, absences visible) and it is the app's own
  visual language (mirrors /parties/), colored by vote instead of party.
- **No masthead:** user rejected any "Abstimmungen" header. Feed/ledger starts
  immediately under the chrome.
- **Deks are generated from partySummaries**, not written: every sentence is derivable
  from counts, so there is nothing to fabricate and nothing to translate per-vote
  beyond the existing i18n word lists.
- **Color = meaning only:** success/danger/neutral for Ja/Nein/Enth everywhere; party
  color never appears in this view (proposer is text).

## Implementation notes for frontend

- **Everything is on the existing list payload.** `VoteListItem`
  (`src/server/votes.ts`) already carries cleanTitle, result, yes/no/abstain/absent,
  totalMembers, proposingParty, and partySummaries with per-party
  yes/no/abstain/absent + position. No backend change, no new data field. The vote
  detail's `summarySimplified` is NOT used here; the description is generated
  client-side (new pure helper, suggest `deriveDek.ts` next to
  `deriveConstellation.ts`, which it replaces).
- **Hemicycle math exists:** `views/partiesList/Hemicycle.tsx` has the identical
  row/radius/angle-sort algorithm. Extract the seat-position generation into a shared
  helper; the votes variant differs only in fill assignment (vote buckets, not
  SEATING_ORDER) and dot vs rect. Keep the coord rounding (toFixed(2)) for hydration.
- **FilterPillRow/FilterPill unchanged on desktop** (sticky under the app nav with
  opaque background + bottom hairline); mobile uses FilterSheet.tsx (floating button +
  bottom sheet) instead, per amendments 14+15.
- **Likely deletions:** VoteHero + useVoteHero + HeroPartyGrid (no hero in this design),
  DuelLine/ConstellationLine/deriveConstellation from this view (DuelLine idiom may
  live on elsewhere), day-band rendering in VotesList mobile path.
- **Known trade-off:** card height is fixed, so titles clamp at 4 lines (22px) with
  ellipsis; longest titles (~70+ chars) truncate on mobile. Full title on the desktop
  row and detail page. Accepted by design; do not shrink type below xl to fit.
- **Prerender:** no new routes; both layouts are the same `/votes/` route, CSS-only
  divergence at 700px.
- aria: card/row aria-label = title + result + all four counts (round-5 rule stands).

## Tokens

Text: xxl only for nothing here (mobile title and desktop headline are xl 22); s for
captions/legends/footers, m for desc/dek. Display numerals 40px (flank counts) are the
poster-token extension from plan 102 phase 2, mobile only. Weights regular/semibold.
Spacing xs/s/m/l/xl as annotated. Framed controls use radius-m; vote surfaces are
unframed. Bars 6px, stroke gaps 2px, min segment 3px. Colors:
success/danger/fg-opacity ladder (70/40/15), three backgrounds; mobile card bg =
`background`. Components: existing FilterPill row; everything else is bespoke view code
(no new shadcn primitives needed).

## Rejected alternatives (do not re-propose)

- V1 half-donut gauge (arc with majority tick, counts flanking): fine but generic;
  user picked the hemicycle.
- V2 full donut with center margin ("+167 Vorsprung Ja"): margin framing buried the
  raw counts; rejected with V1.
- Zeitung masthead front page (direction A), Ticker mono ledger (direction B), Plakat
  poster feed as mobile layout (direction C), and the phase-1 hero + duel-bar row list:
  all superseded by this hybrid.
- Desktop ledger rows (headline+dek | stat trio | agate table) and unify option A
  (centered 620px feed column with sticky gutter daylines): retired in phase 4; user
  chose one card family with the wide two-column split.
