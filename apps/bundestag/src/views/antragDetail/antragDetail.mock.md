# /motions/:id

Round 18 of plan 105. Card-language rehaul of the motion detail page: detail-page
header idiom, a procedural timeline instead of a bare status word, serif summary
prose, and linked votes restyled from the old big-donut blocks to result cards with
the canonical hemicycle. Debate sections (DEBATTE IM ÜBERBLICK, REDEN ZUR
ABSTIMMUNG) were rehauled in round 2 and stay as they are.

## Layout, mobile (390), voted opposition Antrag (archetype 321943)

```
+---------------------------------------------+
| Machtblick (app nav, sticky)            =   |
|                                             |
| (Grüne-Logo)                                |  <- header: proposer logo 32
| Nord-Stream dauerhaft außer                 |     (PartyLogo; plain text for
| Betrieb lassen und Energie-                 |     Bundesregierung, Landmark icon
| abhängigkeit senken                         |     26 for Länder), title
|                                             |     font-display text-xxl semibold
| Offizieller Titel: Sicherheit stärken, …    |  <- text-s opacity-l
|                                             |
| [ANTRAG]  20.05.2025 · Drs. 21/224          |  <- meta row: type chip (outlined,
|                                             |     11px caps) + date + Drs.,
| EINGEBRACHT --- AUSSCHUSS --- ABSTIMMUNG    |     text-m opacity-l
|     20.05.        ✓          ABGELEHNT      |
|      ●------------●--------------●          |  <- VERFAHREN timeline: 3 dots +
|                                             |     hairline connector; done =
| Eingebracht von  (ooooooo) 17               |     fg dot, terminal = success/
|                                             |     danger dot + colored caps
| ZUSAMMENFASSUNG DES ANTRAGS                 |     label; labels text-s caps
| Die Nord-Stream-Pipelines, durch die        |     opacity-l, dates beneath
| russisches Gas nach Deutschland floss,      |
| sollen dauerhaft außer Betrieb bleiben.     |  <- summary: Charter serif text-m,
| Die Bundesregierung soll alle nötigen       |     leading 1.45 (was sans)
| Schritte unternehmen, um das zu             |
| verhindern …                                |
| KI-generierte Kurzfassung auf Grundlage     |  <- notice: plain text-s opacity-l
| des Antragstexts. Volltext hier ↗           |     line (gray box deleted)
|                                             |
| WAS SICH ÄNDERN SOLL                        |  <- summaryDetail h2s render as
| · Die Bundesregierung soll die              |     section captions (text-s caps
|   Inbetriebnahme der Nord-Stream-           |     opacity-l), body serif text-m
|   Pipelines ausdrücklich ausschließen.      |
| · Das Investitionsprüfrecht soll            |
|   erweitert werden …                        |
|                                             |
| HINTERGRUND                                 |
| Seit dem russischen Angriff auf die         |
| Ukraine im Februar 2022 steht die           |
| europäische Abhängigkeit von russischem     |
| Gas in der Kritik …                         |
|                                             |
| ABSTIMMUNGEN                                |  <- section caption
| .-----------------------------------------. |
| |            /=============/              | |  <- linked vote = result CARD:
| |            | ABGELEHNT  |               | |     3px top border danger +
| |            /=============/              | |     white verdict chip straddling
| | 25. JUN 2025 · NAMENTLICH   [ABWEICHLER]| |     it, centered (list-surface
| |                                          | |     rule: no rotated stamps here)
| | Rückkehr zu Nord-Stream-Pipelines        | |
| | ausschließen                             | |  <- kicker: date + type caps
| |                                          | |     left, extra deriveStamps
| |          . · * ° * · .                   | |     verdicts (KNAPP, ABWEICHLER)
| |       .*°*·:::::::·*°*.                  | |     as small outlined chips right
| |      :####:::==·==::%%%%:                | |
| |     :#####::==·==:::%%%%:                | |  <- title: text-l semibold,
| |                                          | |     links to /votes/:id/
| | JA        60 ENTHALTEN            NEIN   | |
| | 90        50 ABWESEND              430   | |  <- hemicycle, canonical result
| |                                          | |     viz (replaces the 630-donut);
| | (( ◕ ))   (( ◑ ))   (( ◌ ))   (( ◌ ))    | |     flanking counts font-display
| | [GRÜNE]   [LINKE]   [AFD]    [CDUCSU]    | |     semibold 32px tabular-nums;
| | Ja 84     Enth 58   Nein 140  Nein 190   | |     legend blocks = filter
| | Abw 1     Abw 6     Abw 12    Abw 18     | |     toggles (round-2 behavior)
| |                                          | |
| | (( ◌ ))                                  | |  <- PartyDonutGrid stays: donut
| | [SPD]                                    | |     72, sorted Ja-share -> Nein-
| | Nein 100                                 | |     share, dims with the filter,
| | Abw 13                                   | |     links to party pages
| '-----------------------------------------' |
|                                             |
| DEBATTE IM ÜBERBLICK                        |  <- unchanged (round-2 idiom:
| …                                           |     logo + stance chip + serif)
| REDEN ZUR ABSTIMMUNG                        |  <- unchanged (DebateList)
| …                                           |
| Quelle: Dokumentations- und Informations-   |  <- source footnote text-s
| system des Deutschen Bundestages ↗          |     opacity-l
+---------------------------------------------+
```

## Header, desktop (max-w-3xl, same column)

```
|  (Grüne-Logo 32)  Nord-Stream dauerhaft außer Betrieb        (cal) 20.05.2025  |
|                   lassen und Energieabhängigkeit senken                        |
|  Offizieller Titel: Sicherheit stärken, Energieabhängigkeiten …                |
|  [ANTRAG]  Drs. 21/224                                                         |
|                                                                                |
|  EINGEBRACHT ●----------------● AUSSCHUSS ----------------● ABSTIMMUNG         |
|  20.05.2025                    ✓                            ABGELEHNT 25.06.   |
```

Detail-page header idiom: logo + `text-xxl font-semibold` title left, secondary
metric (introduced date, Lucide `Calendar`) `ml-auto text-l opacity-l`. The date
then leaves the meta row (no duplication). Everything below is the same
single-column flow as mobile, cards full width.

## Variant: Antrag without vote (archetype 318555, Länder, nicht beraten)

```
| (Landmark 26)  Mietpreisbremse bis 2029 verlängern       (cal) 02.04.2025     |
| Offizieller Titel: Gesetz zur Verlängerung der Mietpreisbremse                |
| [GESETZENTWURF]  Drs. 21/17                                                   |
| ANTRAG DER LÄNDER                                                             |
| [Hamburg] [Berlin] [Brandenburg] [Bremen] [Mecklenburg-Vorp.] [Niedersachsen] |
|                                                                               |
| EINGEBRACHT ●------------○ AUSSCHUSS ------------○ ABSTIMMUNG    /=========/  |
| 02.04.2025                                                       |  NICHT  |  |
|                                                                  | BERATEN |  |
| ZUSAMMENFASSUNG DES ANTRAGS                                      /=========/  |
| Die Mietpreisbremse wird bis 31. Dezember 2029 verlängert …                   |
| KI-generierte Kurzfassung … Volltext hier ↗                                   |
| …                                                                             |
| Vollständige Drucksache ↗            (when no generated detail exists)        |
```

- Timeline shows only reached stages filled; unreached = hollow dots `fg @
  opacity-s`, no invented dates.
- The rotated Stamp survives ONLY here, as the detail-page poster device for
  terminal/parked states not already told by a vote card (current `statusStamp`
  logic: nicht-beraten, ueberwiesen, beschlussempfehlung, and vote-less
  angenommen/abgelehnt). Right of the timeline on desktop, below it on mobile.
  On voted motions the verdict chip on the vote card carries the outcome and no
  stamp renders (also current logic).
- Multi-vote motions (archetype 322883, Bundeshaushalt with 3 votes incl.
  handzeichen) stack one result card per vote, mb-m apart; identical dates/titles
  stop being confusing because each card leads with its own verdict chip + type
  kicker (NAMENTLICH vs HANDZEICHEN). Handzeichen cards: hemicycle from the
  synthesized party tallies, no ABWESEND legend line and no absent claim in the
  aria-label (round-10 rule); VERKÜNDET / KNAPP etc. as outlined kicker chips.

## Timeline stage mapping (derivable, no new data)

| Stage | Filled when beratungsstand / data says |
|---|---|
| EINGEBRACHT | always (date = introducedDate) |
| AUSSCHUSS | Überwiesen, Den Ausschüssen zugewiesen, Beschlussempfehlung liegt vor, or any later state |
| ABSTIMMUNG | linked vote exists (label = ANGENOMMEN/ABGELEHNT + vote date, colored success/danger) or beratungsstand Angenommen/Abgelehnt/Verabschiedet/Abgeschlossen/Verkündet |
| + VERKÜNDET | 4th dot appears only for Gesetzentwürfe that reach Verkündet (success) |

States that leave the Bundestag track (Bundesrat/Vermittlung x4, 1. Durchgang,
Einbringung x2, Für erledigt erklärt) fill up to AUSSCHUSS and render the
beratungsstand text (localized via `t.motionStatus`) as a text-s opacity-l note
under the timeline instead of forcing a false stage. Map lives in one pure helper
next to the view; all 14 DB values must be covered (round-14 list).

## Filters / interactions

- Hemicycle legend blocks per vote card are choice-filter toggles (aria-pressed),
  dimming that card's dots and donut segments; independent per card. Reuses the
  round-2 vote-detail component.
- Vote card title -> /votes/:id/; donuts -> party pages; signatory pile ->
  member pages; state badges stay non-links. The card is NOT a stretched link
  (too many inner links).
- PDF link and source footnote unchanged.

## Why

The page should answer, in order and at a glance: what does this motion want
(serif summary), who wants it (logo + pile), where is it in the machine
(timeline), and what did the chamber do about it (verdict-chip cards with the
hemicycle showing the physical majority).

## Implementation notes

- **No backend change.** Everything renders from the existing `AntragDetail`
  payload (`server/antraege.ts`): beratungsstand, introducedDate, linked votes
  with full tallies + partySummaries already ship. Timeline mapping is a view
  helper.
- Header: `PartyLogo` 32 via `initiativeFraktion`; Länder -> Lucide `Landmark` 26 +
  the existing state badges row; Bundesregierung -> plain text kicker line above
  the title (proposer = logo alone, never logo + name, house rule).
- Result card: reuse the round-2 voteDetail Ergebnis pieces (hemicycle wrapper
  with legend toggles, `PartyDonutGrid`); the card shell + top-edge verdict chip
  is the VoteCard recipe from votesList. `AntragVoteResult.tsx` is the restyle
  target; `VoteDistributionDonut` big-630 usage goes away here (it lives on in
  PartyDonutGrid), rotated `Stamp` usage on vote blocks becomes chip kickers via
  `deriveStamps` (first stamp -> top chip, rest -> outlined kicker chips).
- Summary + summaryDetail prose switch to the Charter `SERIF` stack; markdown h2
  -> `.caption` style; notice box -> plain line (delete the `bg-surface` box,
  same as round 2 did on vote detail).
- i18n: new keys for VERFAHREN stage labels (Eingebracht/Ausschuss/Abstimmung/
  Verkündet), "Antrag der Länder" exists, type chip labels exist; timeline note
  reuses `t.motionStatus`.
- aria: timeline is a `role="list"` of stage items ("Eingebracht am 20.05.2025,
  erledigt"); vote card aria-label = title + result + counts (list rule).

## Tokens

| Element | Text size | Weight | Spacing | Component |
|---|---|---|---|---|
| Title | xxl font-display | semibold | mt-l | — |
| Official title | s | regular, opacity-l | mt-s | — |
| Type chip / kicker chips | 11px uppercase, ls 0.14em | semibold, outlined fg (verdict chip: white on success/danger) | h-[20px] px-s | chip idiom |
| Meta row | m | regular, opacity-l | mt-s, gap-m | — |
| Timeline labels | s uppercase, ls 0.08em | regular, opacity-l (terminal: semibold, success/danger) | mt-m, dots 8px, hairline connector | — |
| Section captions | s uppercase, ls 0.08em | regular, opacity-l | mt-xl mb-s | `.caption` |
| Summary / detail prose | m serif (Charter), leading 1.45 | regular | — | Markdown(Inline) |
| AI notice / source | s | regular, opacity-l | mt-s / mt-xl | link underline |
| Vote result card | — | — | p-l, mb-m, hairline + double shadow, 3px top border, radius-m | card recipe |
| Vote card title | l | semibold | mt-m | link |
| Hemicycle numerals | 32px font-display tabular-nums | semibold | — | shared hemicycle |
| Party donuts | — | — | grid gap-l | VoteDistributionDonut 72 + Tooltip |
| Stamp (no-vote states only) | existing Stamp m | — | — | Stamp |
| Signatory pile | existing | — | mb-l | SponsorPile |

Colors: success/danger for verdicts and terminal timeline states only; party color
only in the header logo and state badges. Radius 0 everywhere.
