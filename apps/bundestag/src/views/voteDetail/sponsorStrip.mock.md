# /votes/:id, Sponsor strip (face pile of Antrag co-signers)

Slots into the existing vote-detail layout **between the proposer/date line and the "Worum geht es" card**. Nothing else on the page changes. When `antraege.length === 0` or all `signatories` are empty, the entire block (caption + pile) is omitted. Render nothing.

## State A: one Antrag, 12 signatories, cap hit

```
+--------------------------------------------------------------+
| < Zurueck zu Abstimmungen                                    |
|                                                              |
| Mietpreisbremse verlaengern                                  |
| SPD  -  12.03.2025                                           |
|                                                              |
|                          [ portrait diameter = fixed height ]|
| Eingebracht von   (O)(O)(O)(O)(O)(O)(O)(O)( +4 )             |
|                    ^ ^ ^ ^ ^ ^ ^ ^   ^^^^                    |
|                    | | | | | | | |   inert chip, same disc   |
|                    +-+-+-+-+-+-+-+-- 8 portraits, overlap    |
|                                      ~35%, leftmost on top   |
|                                                              |
| +----------------------------------------------------------+ |
| | Worum geht es                                            | |
| | ...                                                      | |
| +----------------------------------------------------------+ |
|                                                              |
| Ergebnis: ANGENOMMEN                                         |
| ...                                                          |
+--------------------------------------------------------------+
```

- Caption `Eingebracht von` sits on the **same row** as the pile, left of it, `text-s opacity-l`. No icon, no colon.
- Wrapper height is locked to the portrait diameter (`h-[32px]`) so missing/late-loading images never cause CLS. Caption is vertically centered against this fixed height.
- Portraits overlap with `margin-left: -12px` (≈37% of 32px, from spacing token `m`). Leftmost portrait is on top (`z-index` descending L→R) so the cleanest face is foremost.
- Each portrait is a circular `<img>` with a 1.5 px `background`-colored ring (`stroke-m`) that cuts each disc out of the next. This is the **only** rounded shape on the page.
- After 8 portraits, a `+N weitere` chip with the **same 32 px disc**, `surface` background, `text-s semibold opacity-l`. Inert in v1.

## State B: two Anträge, one pile per Antrag

Chosen layout: **option (b), stacked piles, one per Antrag**. Reason: when a vote bundles parallel motions, the political fault line *is* who tabled which Antrag (e.g. coalition motion vs. opposition counter-motion); merging hides exactly the story this strip exists to tell.

```
+--------------------------------------------------------------+
| < Zurueck zu Abstimmungen                                    |
|                                                              |
| Wehretat 2025 - Aenderungsantraege                           |
| SPD, Gruene / CDU/CSU  -  08.03.2025                         |
|                                                              |
| Antrag SPD, Gruene   Drs. 20/12345                           |
|   (O)(O)(O)(O)(O)(O)(O)(O)( +9 )                             |
|                                                              |
| Aenderungsantrag CDU/CSU   Drs. 20/12346                     |
|   (O)(O)(O)(O)(O)( 0 )                                       |
|   ^^^^^^^^^^^^^^^                                            |
|   5 signatories, no chip                                     |
|                                                              |
| +----------------------------------------------------------+ |
| | Worum geht es                                            | |
| | ...                                                      | |
| +----------------------------------------------------------+ |
+--------------------------------------------------------------+
```

- Per-Antrag header line: `text-s uppercase opacity-l, letter-spacing 0.08em` for the Antrag type ("Antrag", "Aenderungsantrag", "Gesetzentwurf"), then `text-s regular opacity-l` for the Drucksache. House-convention section caption style, no `text-l semibold` here, that's reserved for the page `<h1>`.
- Vertical gap between Antrag blocks: `gap-m` (12 px). Caption-to-pile gap: `gap-xs` (4 px).
- The whole strip still sits in one logical block above the "Worum geht es" card; only the internal layout stacks.

### Fallback for >3 Anträge (bundle votes)

```
| Eingebracht von   Anträge: 5   (O)(O)(O)(O)(O)(O)(O)(O)( +37 )
```

Single merged pile, caption replaced by `Anträge: N` (`text-s opacity-l`) immediately before the portraits. Same 32 px row, same cap.

## Interactions

- **Portrait click** → `/members/:id/`.
- **Portrait hover tooltip** → `Vorname Nachname · Partei` (party resolved at vote date via `partyAt`). Tooltip is the shadcn Tooltip primitive; not drawn here.
- **`+N` chip** is inert in v1. No modal, no route. Set the chip's `title` attribute to the comma-joined remaining names so a desktop hover reveals them; mobile/touch sees nothing, which is acceptable for v1.
- **Ordering.** Backend returns signatories ordered by last name (per the contract). No sort UI in this strip.
- **Keyboard.** Each portrait is a focusable `<a>`. Focus ring uses the global default; no per-component override.

## Notes

- The strip is **portrait-height tall, no taller**. Caption and pile share that single row. This is what guarantees the result section never shifts down by more than 32 px regardless of image load state.
- 32 px diameter chosen to match the vote-symbol header logo on this same page (CLAUDE.md house convention: 32 for vote-scoped identity). The list-row pattern (36 px in `SpeechEntry`) is for full row contexts; an inline strip wants a tick smaller.
- Border between overlapping discs uses `background` color, not `surface`, because the strip sits on the page background. If the strip is ever placed inside a Card, swap to `surface`, frontend's call at integration.
- Multi-Antrag stacking (State B) means total strip height = `N * (32 + caption-line + gap-m)`. For the common 1-Antrag case this collapses to a single row.

## Tokens

| Element | Text size | Weight | Spacing | Component |
|---|---|---|---|---|
| Caption "Eingebracht von" | s | regular, opacity-l | mr-s | |
| Antrag-block caption (State B) | s uppercase, letter-spacing 0.08em | regular, opacity-l | mb-xs | |
| Drucksache (State B) | s | regular, opacity-l | ml-s | |
| Portrait disc | | | size-[32px], ring stroke-m in `background` | (plain `<img>` + `rounded-full`) |
| Portrait overlap | | | ml-[-12px] (≈ -m), descending z-index | |
| `+N weitere` chip | s | semibold, opacity-l | size-[32px], `surface` bg, `rounded-full` | |
| Strip wrapper (State A) | | | h-[32px], mb-l, flex items-center | |
| Strip wrapper (State B) | | | gap-m vertical, mb-l | |
| Hover tooltip "Name · Partei" | s | regular | | Tooltip |

Components used: Tooltip. Everything else is bare elements, no Card, no Badge, no Button. The strip is intentionally below the component-vocabulary line so it reads as page chrome, not a widget.

## Open questions for designer → lead

None. All structural decisions taken:

- Portrait diameter = 32 px (matches vote-scoped identity in house conventions).
- Multi-Antrag = stacked piles per Antrag (option b), with the >3 fallback collapsing to one merged pile and `Anträge: N` caption, already specified by the plan.
- `+N` chip = inert with `title` attribute. No modal in v1.
