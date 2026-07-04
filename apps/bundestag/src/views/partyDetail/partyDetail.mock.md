# /parties/:id (full card-language rehaul)

Round 13 of plan 105. Supersedes the old partyDetail.mock.md entirely.
partyDetail.verlauf.mock.md's information architecture (chart, event strip,
tooltips, empty state) fully survives; only token corrections apply here
(see Verlauf tab).

Scan signal: **the Fraktion's line and its discipline**. The header states
who this party is and how united it shows up (two poster stats grown from
the PartyCard the user just tapped); the Abstimmungen tab opens with the
party's line fingerprint and every vote row leads with the party's stance
chip; the Profil tab leads with the Erfolgsquote (how often the chamber
followed this party), the number that separates government from opposition
at a glance (96% vs 4%).

## Header, mobile (< 700px, 390 primary)

```
+------------------------------------------+
| Machtblick (app nav, sticky)          =  |
|                                          |
| (logo 44)  CDU/CSU                       |  <- name: font-display xxl
|                                          |     semibold; logo 44 per the
| REGIERUNG · 210 SITZE · 33 % DES         |     detail-header convention
| BUNDESTAGS                               |  <- meta captions: text-s caps
|                                          |     fg@70, ls 0.08em, · separated,
|                                          |     wraps freely; "210 SITZE" is
|                                          |     a link to /members/?party=X
| GESCHLOSSENHEIT      ANWESENHEIT         |  <- caption s caps fg@70
| 97%                  92%                 |  <- poster numeral: 32px
| [#############---]   [############----]  |     font-display semibold tabular
| 57 ABSTIMMUNGEN      (no sub-caption)    |  <- bar h-[6px], success fill on
|                                          |     fg@15 track; sub-caption
|                                          |     optional (MemberStatBar idiom)
| [ Profil ][ Abstimmungen ][ Verlauf ]    |  <- tabs keep border-y style;
| [        ][      57      ][         ]    |     vote count in label, fg@40
+------------------------------------------+
```

- Identity = logo 44 (decorative, party color's sanctioned home) + name.
  The old ml-auto Users-icon seat count folds into the meta caption row
  (round-9 header idiom: caption meta, no orphan secondary metric).
- Meta row: REGIERUNG or OPPOSITION (from `isGoverning`), seats (linked to
  the filtered members grid), share of chamber. Fraktionslos has no detail
  page, so no branch needed here.
- Poster stats reuse `memberDetail/MemberStatBar` verbatim (caption + 32px
  numeral + 6px success bar + optional sub-caption). GESCHLOSSENHEIT
  sub-caption = "57 ABSTIMMUNGEN" (the averaging base); ANWESENHEIT none.
- These two stats REPLACE the Profil tab's StatPie discs; the data moves up,
  continuous with the PartyCard bars the user just tapped (see open
  questions: the discs are a viz, removal needs user sign-off).

## Header, desktop (>= 700px, container stays max-w-3xl)

```
| Machtblick   Abstimmungen  Abgeordnete  Reden  Fraktionen      [Deutsch] |
|                                                                          |
| (logo44) CDU/CSU                    GESCHLOSSENHEIT    ANWESENHEIT       |
| REGIERUNG · 210 SITZE ·             97%                92%               |
| 33 % DES BUNDESTAGS                 [############--]   [##########----]  |
|                                     57 ABSTIMMUNGEN                      |
|                                                                          |
| [     Profil     ][   Abstimmungen 57   ][     Verlauf     ]             |
```

Same component reflowed: identity block left, stats in a 2-col grid right
(`ml-auto`, each column ~200px). Tabs unchanged below.

## Profil tab (default)

```
+------------------------------------------+
| ERFOLGSQUOTE                        (i)  |  <- caption s caps fg@70 +
| 96%                                      |     Info Tooltip (existing
| [################################--]     |     cohesionInfo pattern)
| 55 VON 57 ERGEBNISSE ENTSPRACHEN DER     |  <- sub-caption s caps fg@70
| LINIE DER FRAKTION                       |     (danger-free: 4% for the
|                                          |     opposition is the honest bar)
| ÜBEREINSTIMMUNG                          |
| (logo)  [##################----]  100%   |  <- alignment rows: PartyLogo 20
| (logo)  [#########-----------]    49%    |     (wordmark = name), 3px
| (logo)  [######--------------]    31%    |     success bar on fg@15 track,
| (logo)  [#####---------------]    29%    |     m semibold tabular value;
|                                          |     row links to that party,
|                                          |     Tooltip: "49% bei 57
|                                          |     gemeinsamen Abstimmungen"
| ANTRÄGE               12 / 43 ANGENOMMEN |  <- caption row; right side
| [##|%%|%%|##|%%|##|%%|%%|%%|%%|%%|%%|##] |     tabular. Bar: existing h-8
|                                          |     gap-[2px] segments, success/
|                                          |     danger per proposal, Tooltip
|                                          |     + link per segment (unchanged
|                                          |     ProposalsBar, already on
|                                          |     token)
| GROSSSPENDEN              4 · 200.000 €  |
| [############|######|####|##]            |  <- share bar: h-8 gap-[2px],
|                                          |     segments fg@70 / fg@40
| Muster Holding GmbH          80.000 €    |     alternating, Tooltip per
| 12. MRZ 2026                             |     segment (kept)
| Beispiel Stiftung            60.000 €    |  <- NEW donor list: name text-m
| 04. FEB 2026                             |     (wraps), date s caps fg@70,
| Platzhalter AG               40.000 €    |     amount m semibold tabular
| 22. JAN 2026                             |     right; rows py-s, hairline
| ...                                      |     fg@8; sorted desc; no party
|                                          |     color, donations are neutral
| ABGEORDNETE                              |     facts (audit finding 6)
|                                          |
|  (( ◑ ))          (( ◔ ))                |  <- demographics: PieDonut tiles
|  GESCHLECHT       ALTER                  |     (membersList round-13 strip
|                                          |     idiom): gender = blue/purple/
|  ALLE 210 ABGEORDNETEN ->                |     rust accents, age = fg ramp;
+------------------------------------------+     link row to filtered grid
```

Desktop: 2-col grid (`gap-x-xl`), left = ERFOLGSQUOTE + ÜBEREINSTIMMUNG,
right = ANTRÄGE + GROSSSPENDEN, ABGEORDNETE full-width beneath.

- ERFOLGSQUOTE: `successRate` already exists on the payload and is rendered
  nowhere. It is the sharpest single number on this page (government ~96%,
  AfD ~4%) and leads the tab as a MemberStatBar-style poster stat. Fill is
  success even when tiny: an honest 4% bar IS the story.
- ÜBEREINSTIMMUNG: names dropped, logo-only (all five logos are wordmarks);
  bar 3px matching every other metric bar (the old 8px h-2 was off-scale);
  value semibold. sharedVotes moves into the Tooltip.
- GROSSSPENDEN per audit finding 6: the share bar keeps the proportional
  story but every donor is now named in the list beneath (mobile and
  desktop; at no width are segments reliably wide enough for inside
  labels). fg@70/40 alternation is the token restatement of the old
  bespoke grays.
- ABGEORDNETE: two PieDonut tiles (Geschlecht, Alter) exactly per the
  restored membersList strip (white radius-0 tile cards, caption label,
  hover/click select, center pct). Needs a small backend aggregation, see
  implementation notes + open questions.

## Abstimmungen tab

```
+------------------------------------------+
| FRAKTIONSLINIE                           |  <- caption s caps fg@70
| [#######JA#######|####NEIN####|=|::]     |  <- fingerprint: stacked h-8 bar,
| 31 JA · 22 NEIN · 2 ENTHALTEN ·          |     gap-[2px], segments = count of
| 2 GESPALTEN                              |     votes per party line: success/
|                                          |     danger/yellow/fg@15(outline
|                                          |     feel for GESPALTEN); Tooltip
|                                          |     per segment; tap toggles the
|                                          |     Stimme filter; legend text-s,
|                                          |     counts semibold
| v [Fraktion stimmte v] [Ergebnis v]      |  <- FilterPillRow inline on BOTH
|                                          |     devices (detail page, never
| ------------------------------------------     the floating feed pill)
| [  JA  ]   Bundeswehreinsatz im Libanon  |  <- stance chip leads: solid,
|            (UNIFIL)                      |     white text on choice color,
|            25. JUN 2026 · ■ ANGENOMMEN   |     11px caps semibold, fixed
| ------------------------------------------     104px chip column
| [ NEIN ]   Mietpreisbremse verlängern    |  <- title: font-display semibold
|            12. JUN 2026 ·                |     text-l, wraps, no clamp
|            GESCHLOSSENHEIT 78% ·         |  <- broken ranks surfaced: when
|            ■ ANGENOMMEN                  |     cohesion < 95%, danger
| ------------------------------------------     semibold caption in meta row
| [GESPALTEN] Wehrpflicht                  |  <- split: outlined chip, fg@70
|            Wiedereinführung              |     border + text (no line = no
|            08. MAI 2026 · ■ ABGELEHNT    |     color; semibold per the
| ------------------------------------------     mixed-party house rule)
| [ENTHALTEN] Cannabis-Reform zweite       |  <- Enthalten: yellow bg, dark
|            Lesung                        |     text (voteDetail rule)
|            02. MAI 2026 · ■ ABGELEHNT    |
+------------------------------------------+
```

- Row grid: `grid-cols-[104px_1fr]`, hairline fg@8 between rows, py-m,
  whole row links to `/votes/:id/` (memberDetail round-9 row idiom).
- Outcome = 6px square dot success/danger + ANGENOMMEN/ABGELEHNT text-s
  caps fg@70. The rotated Stamp leaves this list (banned on list surfaces).
- Meta row order: short date · (GESCHLOSSENHEIT {n}%, danger semibold
  caption, only when `cohesion !== null && cohesion < 0.95`) · outcome
  dot + word.
- Desktop: same grid, meta stays under the title.

## Verlauf tab

IA unchanged from partyDetail.verlauf.mock.md (chart, event strip, tooltips,
single-term empty state, recharts exception). Token corrections only:

```
+------------------------------------------+
| ANTEIL AM BUNDESTAG          2017 - heute|  <- caption row unchanged
|                                          |
|  +  GRÜNDUNG AFD                         |  <- event label: s caps fg (FULL
|  ¦                              23,8%    |     opacity), icon fg; guide line
|  ¦                                .      |     1px dashed fg@40. The live
|  ¦ 12,1%                        .        |     EVENT_PALETTE (rust/teal/
|  ¦   .        10,4%           .          |     indigo/brown) is color as
|  ¦     ` - - - .- - - - - - `            |     decoration and reverts to
|  ¦             '                         |     the verlauf mock's neutral-fg
|  +--------------------------------------+|     spec
|    19.           20.            21.      |
+------------------------------------------+
```

- Line + area gradient stay `PARTY_COLOR` (the page subject's identity, the
  sanctioned use per the verlauf mock's color table).
- Dot value labels s fg@70, axis ticks s fg@70, gridlines fg@15 dashed:
  already on token, keep.
- Event labels rendered as captions (s caps, ls 0.08em) to match every
  other label on the page.

## Filters / interactions

- Header: seats caption -> `/members/?party=X`; logo decorative (we are
  already on the party page).
- Profil: alignment rows -> other party pages; Anträge segments ->
  `/votes/:id/` (Tooltip first on touch, existing behavior); donation
  segments Tooltip only (no donor pages); demographics donuts select on
  click (visual highlight only, per strip idiom); ABGEORDNETE link ->
  `/members/?party=X`.
- Abstimmungen: fingerprint segments toggle the Stimme filter (tap active
  segment to clear, non-matching rows filtered, mirrors
  ChoiceFingerprintBar); pills Fraktion-stimmte + Ergebnis keep URL
  semantics; row -> vote detail.
- Verlauf: hover/tooltip per the verlauf mock, unchanged.
- Detail pages keep inline pill rows on mobile; no floating filter button.

## What it emphasizes at a glance

Whether this Fraktion holds power and holds together: header bars give
discipline and presence, Erfolgsquote gives its grip on outcomes, and the
stance-chip rail plus fingerprint bar show its line (a wall of red for the
opposition, green for the coalition) with every break in ranks flagged in
danger.

## Why (decisions)

- **Poster bars in the header, not discs:** continuity is the argument. The
  user arrives from a PartyCard carrying these exact captions and success
  bars; the header scales them up exactly as memberDetail does from
  MemberCard. Two 120px discs would restate the same two numbers in a
  second visual language on the same screen.
- **Erfolgsquote leads Profil:** it is the one number that distinguishes
  governing from opposing better than the Regierung label, it exists on the
  payload today, and the tab previously led with stats that now live in the
  header.
- **Donors named, color-free** is audit finding 6 verbatim: three anonymous
  gray blocks were meaningless at a glance and off-palette. Names + amounts
  are the actual transparency payload of this section.
- **Stance chip left, outcome demoted** mirrors audit finding 4's logic on
  the member page: on a party page the party's line is the story, the
  chamber outcome is context. Rotated stamps are banned on lists anyway.
- **Fingerprint bar over per-row mini-viz:** established house idiom,
  doubles as the filter; 57 repeated donuts/hemicycles are noise (settled
  in round 9).
- **PartyHistoryChart is kept** (loved viz class; standing rule: restyle,
  never delete). Only its decorative event palette reverts to the
  neutral-fg spec its own mock always had.

## Implementation notes for frontend

- **Backend touch (only for demographics):** `PartyDetail` gains
  `demographics: { sex: Record<MemberSex, number>, age: number[] /* bucket
  counts */ }` aggregated over current party members;
  `loadDemographics()` in `server/members.ts` already extracts sex +
  yearOfBirth from member_abgeordnetenwatch, reuse it (export or move to a
  shared server helper). Everything else renders from the existing payload
  (successRate, cohesion, attendance, alignments incl. sharedVotes,
  proposals, donations, votes with per-row cohesion).
- **Survives:** PartyDetailTabs (add vote count in label, fg@40),
  ProposalsBar (unchanged), AlignmentList (restyled: logo-only, 3px bar,
  Tooltip gains sharedVotes), DonationsBar (keeps bar, gains donor list),
  PartyHistoryPanel/Chart/EventStrip/Tooltip/Empty (EVENT_PALETTE -> fg@40
  guide lines + fg labels), FilterPill(Row), MemberStatBar (imported from
  memberDetail; if cross-view import feels wrong, lift it to a shared
  views location, do not fork it), PieDonut + gender/age color recipes from
  the membersList strip, PartyLogo, `isGoverning`.
- **Restyled:** PartyDetailShell header per above (Users-icon ml-auto seat
  link dies, meta caption row added), PartyVotesPanel (fingerprint +
  chip-led rows; its private VoteChip dies in favor of the shared
  `memberDetail/VoteChoicePill` + a new outlined GESPALTEN variant),
  PartyProfilePanel (new section order).
- **Dies on this page:** StatPie usage (see open questions; the file loses
  its last importer), `Stamp` import in PartyVotesPanel (component survives
  on other detail surfaces), VoteChip in PartyVotesPanel.
- **New:** PartyLineFingerprint (thin wrapper over the ChoiceFingerprintBar
  mechanics with party-line buckets incl. GESPALTEN), DonorList (or fold
  into DonationsBar), PartyDemographics (two PieDonut tiles + link row).
- **i18n keys needed:** successRate ("Erfolgsquote"/"Success rate") +
  info text, resultsMatchedLine ("{n} von {total} Ergebnisse entsprachen
  der Linie"), partyLine ("Fraktionslinie"), shareOfBundestag exists,
  allMembersOf ("Alle {n} Abgeordneten"), gespalten/split exists (t.split),
  government/opposition exist.
- **Prerender:** routes unchanged (`profile/votes/history` already in
  `prerenderPaths()`), nothing to add.

## Open questions for lead / user

1. **StatPie discs retire from this page** (their data moves to the header
   bars). The pie is a viz and the standing rule says restyle over delete:
   if the user wants discs kept, the fallback is header = identity only and
   Profil keeps a three-disc row (Geschlossenheit, Anwesenheit,
   Erfolgsquote). Recommendation: retire here; the page still gains a viz
   (demographics donuts), so the donut count does not drop.
2. **Demographics strip needs the small backend aggregation.** Include in
   this round (recommended, plumber/backend touch is ~20 lines) or ship the
   rest and defer the ABGEORDNETE section?
3. **Cohesion-callout threshold** on vote rows is proposed at < 95%.
   With WP21 cohesion averaging 97-100% this flags only genuine breaks;
   confirm or tune.

## Tokens

| Element | Size / weight | Notes |
|---|---|---|
| Party name | xxl font-display semibold | header h1 |
| Meta captions | s caps regular fg@70, ls 0.08em | · separated, seats = link |
| Poster stat numeral | 32px font-display semibold tabular-nums | header + Erfolgsquote |
| Stat caption / sub-caption | s caps fg@70 | |
| Header stat bars | h-[6px] | success fill, fg@15 track |
| Section captions (ERFOLGSQUOTE, ÜBEREINSTIMMUNG, ANTRÄGE, GROSSSPENDEN, ABGEORDNETE, FRAKTIONSLINIE, ANTEIL AM BUNDESTAG) | s caps regular fg@70, ls 0.08em | never text-l semibold |
| Alignment bars | h-[3px] | success fill, fg@15 track, value m semibold tabular |
| Anträge / donations / fingerprint bars | h-8, gap-[2px] | Tooltip per segment |
| Donation segments | fg@70 / fg@40 alternating | neutral facts |
| Donor rows | m name, s caps date, m semibold tabular amount | hairline fg@8, py-s |
| Stance chip | 11px caps semibold | solid white-on-color; yellow -> dark text; GESPALTEN outlined fg@70 |
| Vote row title | l font-display semibold | wraps, no clamp |
| Outcome | 6px square dot success/danger + s caps fg@70 | |
| Cohesion callout | s caps semibold danger | only < 95% |
| Tab label | l regular (active semibold) | count fg@40 |
| Demographics tiles | PieDonut per strip idiom | white radius-0 tile, MemberCard shadow |
| Chart | party color line/area only | events fg, guides fg@40, grid fg@15 |
| Spacing | xs/s/m/l/xl only | section gap xl, header gap l |

Colors: success/danger/yellow = ballot meaning, success = positive metrics
(incl. a 4% Erfolgsquote), fg ladder for neutral facts (donations, counts),
party color only in logo + history line. Components: Tabs (existing nav),
Tooltip, FilterPill(Row), Skeleton; recharts stays a Verlauf-scoped
exception. Radius 0 everywhere; no rotated stamps, no accent rails, no gray
card backgrounds, no bespoke grays.

## Rejected alternatives (do not re-propose)

- StatPie discs next to the logo in the header: disc overload, rejected for
  memberDetail in round 9 for the same reason.
- Regierung/Opposition as a colored chip or top-edge verdict: grouping/
  caption is the idiom (see partiesList mock); success/danger edges mean
  vote outcomes.
- Per-vote mini donut or hemicycle in the Abstimmungen rows: repeated-viz
  noise, settled in rounds 2 and 9.
- Party color on alignment bars, donation segments, or event markers:
  identity only.
- Deleting the history chart or the Anträge bar: loved viz class; restyle
  only.
