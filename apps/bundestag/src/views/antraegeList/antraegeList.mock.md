# /motions/ (new index view)

Round 18 of plan 105, resolving round-14 finding 4: /motions/ 404s while every
/motions/:id URL and the sitemap make it guessable. Decision: build the index.
Motions are a primary content type (943 in WP21 with generated descriptions: 598
Anträge, 345 Gesetzentwürfe, translated titles since round 4); they deserve a
front door instead of only being reachable through member tabs and vote pages.

New view folder `antraegeList` (this file); route `/motions/` (+ `/en/motions/`).

## Layout, mobile (390)

Stacked card list (like the round-18 speeches feed, NOT a snap feed: motion cards
are text-heavy and have no per-sitting rhythm). No masthead. Floating filter pill +
bottom sheet, house mobile-feed idiom.

```
+---------------------------------------------+
| Machtblick (app nav, sticky)            =   |
|                                             |
| 943 ANTRÄGE UND GESETZENTWÜRFE              |  <- count caption, text-s caps
|                                             |     opacity-l
| .-----------------------------------------. |
| |            /=============/              | |  <- verdict chip on the top edge
| |            | ABGELEHNT  |               | |     (3px top border + white chip)
| |            /=============/              | |     only for decided motions:
| | (Grüne-Logo) · 20. MAI 25 · ANTRAG      | |     ABGELEHNT danger,
| |                                          | |     ANGENOMMEN / VERKÜNDET
| | Nord-Stream dauerhaft außer              | |     success
| | Betrieb lassen und Energie-              | |
| | abhängigkeit senken                      | |  <- kicker: proposer logo 17
| |                                          | |     (plain text for BReg /
| | Die Nord-Stream-Pipelines sollen         | |     Länder / Sonstige) + short
| | dauerhaft außer Betrieb bleiben. Die     | |     date + type, text-s caps
| | Bundesregierung soll alle nötigen        | |     fg@70
| | Schritte unternehmen …                   | |
| |                                          | |  <- title: font-display xl
| | JA 90   NEIN 430          25. JUN 2025   | |     semibold, clamp 3
| '-----------------------------------------' |
| .-----------------------------------------. |  <- summary: serif text-m,
| | (BUNDESREGIERUNG) · 26. JUN 25 ·         | |     clamp 3 (plainDescription /
| |                     GESETZENTWURF        | |     summarySimplified clip)
| |                                          | |
| | Bundeshaushalt 2025                      | |  <- result line, only when a
| |                                          | |     vote exists: JA/NEIN counts
| | Das Gesetz legt den Bundeshaushalt für   | |     text-m semibold tabular-nums
| | 2025 fest, also wie viel der Bund        | |     in success/danger + vote
| | einnehmen und ausgeben darf …            | |     date text-s opacity-l right.
| |                                          | |     Latest namentliche vote;
| | JA 328   NEIN 270         18. SEP 2025   | |     omit line for handzeichen-
| '-----------------------------------------' |     only (synthesized tallies,
| .-----------------------------------------. |     chip alone tells the outcome)
| | (SPD-Logo) · 12. JUN 25 · ANTRAG        | |
| |                                          | |  <- undecided motion: NO top
| | Mindestlohn-Kommission stärken           | |     chip, no result line; status
| |                                          | |     as caps text in the kicker
| | Die Kommission soll künftig …            | |     right slot: ÜBERWIESEN /
| |                          IM AUSSCHUSS    | |     NICHT BERATEN etc. -> bucket
| '-----------------------------------------' |     label text-s caps opacity-l
|                                             |
|              ( Filter · 0 )                 |  <- floating pill + bottom sheet:
|                                             |     Typ, Antragsteller, Status
|  <  1  2  ...  118  >                       |  <- Pager, 8 per page
+---------------------------------------------+
```

Card is one stretched link to /motions/:id/ (aria-label = title + type + status);
the kicker PartyLogo keeps its own party link above it, same as VoteCard.

## Layout, desktop (>= 700px, max-w-3xl column, same card)

```
| Machtblick   Abstimmungen  Anträge  Abgeordnete  Reden  Fraktionen             |
|                                                                                |
|  v [Typ v] [Antragsteller v] [Status v]                                        |  <- FilterPillRow, sticky
|                                                                                |
|  943 ANTRÄGE UND GESETZENTWÜRFE                                                |
|                                                                                |
|  .---------------------------------------------------------------------------. |
|  |                              /=============/                               | |
|  |                              | ABGELEHNT  |                                | |
|  |                              /=============/                               | |
|  |  (Grüne-Logo) · 20. MAI 2025 · ANTRAG                                      | |
|  |  Nord-Stream dauerhaft außer Betrieb lassen und                            | |
|  |  Energieabhängigkeit senken                                                | |
|  |  Die Nord-Stream-Pipelines sollen dauerhaft außer Betrieb bleiben.         | |
|  |  Die Bundesregierung soll alle nötigen Schritte unternehmen, um das        | |
|  |  zu verhindern, und zugleich sicherstellen, dass Europa …                  | |
|  |  JA 90   NEIN 430                                        25. JUN 2025      | |
|  '---------------------------------------------------------------------------' |
```

Same component, wider; clamp 2 on the title, clamp 3 on the summary. No
two-column split (no viz block heavy enough to earn one; the result line is a
single row).

## Filters / interactions

- **Typ**: Antrag / Gesetzentwurf.
- **Antragsteller**: same option set as /votes/ (parties, Bundesregierung,
  Länder, Sonstige) from `initiativeFraktion`.
- **Status**: 4 derived buckets, not raw beratungsstand (18 raw values are
  filter noise): Angenommen (incl. Verabschiedet/Verkündet/Abgeschlossen),
  Abgelehnt, Im Verfahren (Überwiesen/Ausschuss/Beschlussempfehlung/Bundesrat/
  Vermittlung/1. Durchgang), Nicht beraten. Bucket helper shared with the
  detail page's timeline mapping.
- Sort: latest activity desc (max of introducedDate and latest linked vote date);
  no sort control v1.
- Desktop FilterPillRow (funnel lead icon), mobile floating pill + sheet, URL
  params like /votes/. Pager 1-indexed.

## Why

A citizen should be able to browse what parliament is being asked to do, and see
at one glance who is asking (logo), what kind of instrument it is (type), and
whether the chamber has already said yes or no (chip + counts) before reading a
single sentence.

## Implementation notes (this view is net-new, flag everything)

- **Backend (new)**: `listAntraege` server fn in `server/antraege.ts`: id, type,
  cleanTitle/title, initiativeFraktion, introducedDate, beratungsstand,
  description clip (plainDescription already exists for meta descs, reuse its
  first ~200 chars), latest linked namentliche vote {date, yes, no, result} +
  hasVote/result for handzeichen-only. Locale-aware (en title + en description
  via the existing translation tables; en entries exist for all 943 since
  round 4, verify before shipping). Paged or full-list-into-client like /votes/
  (943 rows x ~300 bytes is fine as one payload; prefer full list + client
  filter/pager for filter-count honesty, same as /votes/).
- **Route**: `routes/motions/index.tsx` (+ en twin), loader-fed, thin. MUST be
  added to `prerenderPaths()` in `vite.config.ts` (both locales) or it falls to
  the SPA fallback with no data, and to the sitemap (list lastmod = latest
  motion activity, matching round-12 rules).
- **Nav**: add "Anträge" / "Motions" to the app nav (else the index stays an
  orphan and the 404 problem just moves). Order: Abstimmungen · Anträge ·
  Abgeordnete · Reden · Fraktionen. Lead sign-off needed (5th nav item).
- **Card**: VoteCard shell recipe (white bg, hairline + double shadow, 3px top
  border + chip only when decided, radius 0, padding l, stretched link).
  Verdict chip variants: ABGELEHNT danger; ANGENOMMEN and VERKÜNDET success
  (two labels, one color; Verkündet is the stronger claim, show it when
  reached).
- **No new primitives**; PartyLogo, chip idiom, FilterPill(Row), FilterSheet,
  Pager all exist.
- 404 view stays for unknown ids; /motions/ stops 404ing.

## Tokens

| Element | Text size | Weight | Spacing | Component |
|---|---|---|---|---|
| Count caption | s uppercase, ls 0.08em | regular, opacity-l | mb-m | — |
| Card | — | — | p-l, mb-m, hairline + double shadow, radius 0 | card recipe |
| Verdict chip / top border | 11px uppercase, ls 0.14em | semibold, white on success/danger | 3px border, chip straddles | chip idiom |
| Kicker | s uppercase, ls 0.08em | regular, fg@70 | gap-s | PartyLogo 17 |
| Status text (undecided) | s uppercase, ls 0.08em | regular, opacity-l | right slot | — |
| Title | xl font-display | semibold | mt-s, clamp 3 (mob) / 2 (desk) | link (stretched) |
| Summary | m serif (Charter), leading 1.45 | regular | mt-s, clamp 3 | — |
| Result line counts | m tabular-nums | semibold, success/danger | mt-m, gap-l | — |
| Result line date | s | regular, opacity-l | ml-auto | — |
| Filters / pager | existing | — | — | FilterPill(Row), FilterSheet, Pager |

Colors: success/danger only on the chip and result counts; party color only in
the kicker logo. Radius 0; floating filter pill is the sanctioned exception.
