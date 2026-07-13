# App Store Screenshot Storyboard

Four marketing images ship in `de-DE` and `en-US`. German is the default. Each locale uses five real app captures rendered into four final PNGs, all at 1284 x 2778 px.

The English sources come from the app's English language mode. Every image has one Fraunces display headline and no subtitle. Backgrounds are solid. There is no external logo or visible sequence number, although output filenames keep numeric prefixes for upload order.

The selected denser second pass targets 80 to 95 percent visual occupancy with no dead lower band.

## Current decision

Capture route: `AppStoreScreenshotDestination.votes`

Source: `iphone-aktuelle-abstimmung.png`

Output: `01-iphone-65-heute.png`

Copy:

| Locale | Headline | Highlight |
|---|---|---|
| `de-DE` | Was der Bundestag heute entscheidet | `Bundestag`, yellow `#f4d84f` |
| `en-US` | What the Bundestag decides today | `Bundestag`, yellow `#f4d84f` |

App state: the votes feed opens on `Einführung eines allgemeinen Straßen-Tempolimits von 130 km/h`, dated 9 July 2026. The card shows `ABGELEHNT`, its summary, the hemicycle, 137 Ja, 467 Nein, and 26 nicht abgegeben. English renders the same state with true English UI and content.

Composition: solid mint `#dff4e5`, ink `#102218`. The 132 px headline sits at x 56, y 96, width 1172. Two elevated white result callouts sit at y 540 above a centered phone entering from below. The phone starts at x 72, y 640, width 1140.

Callouts:

- Left: `137 JA` or `137 YES`, green border `#3f8d58`, rotated -5 degrees.
- Right: `467 NEIN` or `467 NO`, red border `#b94f61`, rotated 5 degrees.

```text
+------------------------------------------------+
| Was der [BUNDESTAG] heute entscheidet          |
|                                                |
|  / 137 JA /                       / 467 NEIN / |
| .--------------------------------------------. |
|/ Machtblick                         Filter    \|
|| GRÜNE       ABGELEHNT       09.07.2026       ||
|| Einführung eines allgemeinen                ||
|| Straßen-Tempolimits von 130 km/h             ||
||                                               ||
|| verständliche Zusammenfassung                ||
||                                               ||
||             . . . . . . .                    ||
||          . . . . . . . . .                   ||
||         JA 137                 NEIN 467       ||
||               26 NICHT ABGEGEBEN              ||
+|-----------------------------------------------|+
```

Interactions represented: the feed filter remains available, and tapping the card opens the vote detail.

Emphasis: a current Bundestag decision, its context, and its result are legible before reading small app text.

## Member accountability

Capture route: `AppStoreScreenshotDestination.member("ruffer-corinna")`

Source: `iphone-abgeordneten-stimmen.png`

Output: `02-iphone-65-abgeordneten.png`

Copy:

| Locale | Headline | Highlight |
|---|---|---|
| `de-DE` | Wie Abgeordnete wirklich stimmen | `wirklich`, yellow `#f4d84f` |
| `en-US` | How members really vote | `really`, yellow `#f4d84f` |

App state: Corinna Rüffer, B90/Grüne, at the top of the selected `Abstimmungen` or `Votes` tab. Her identity, 83 percent attendance, 82 percent party-line loyalty, and 9 deviations are visible. The first card shows her Ja vote on Tempo 130 in line with her party. The second shows her Enthaltung on additional Ukraine aid as an Abweichung. English uses the same member and ballots in English app UI.

Composition: solid peach `#ffdcd2`, ink `#291718`. A centered phone enters from above at x 112, y -140, width 1060. Two elevated callouts overlap the lower vote-card area at y 1510. The 140 px headline sits below the phone at x 56, width 1172, with y 2180 for `de-DE` and y 2290 for `en-US`.

Callouts:

- Left: `83 % ANWESENHEIT` or `83% ATTENDANCE`, green border `#3f8d58`, rotated -4 degrees.
- Right: `9 ABWEICHUNGEN` or `9 DEVIATIONS`, red border `#b94f61`, rotated 4 degrees.

```text
+------------------------------------------------+
|  | Corinna Rüffer · GRÜNE                  |  |
|  | Rheinland-Pfalz · Landesliste           |  |
|  |                                         |  |
|  | 83 %                    82 %             |  |
|  | ANWESENHEIT             LINIENTREUE      |  |
|  | [Abstimmungen]          Reden            |  |
|  |                                         |  |
|  | Tempo 130 · STIMME JA · LINIE           |  |
|  |   ○      ○      ○      ○      ○          |  |
|  | Ukraine-Hilfe · ENTHALTEN               |  |
| / 83 % ANWESENHEIT /   / 9 ABWEICHUNGEN /    |
|  | ABWEICHUNG                              |  |
|  '-----------------------------------------'  |
|                                                |
| Wie Abgeordnete [WIRKLICH] stimmen            |
+------------------------------------------------+
```

Interactions represented: tabs switch between votes and speeches, and each vote card opens its full result and context.

Emphasis: member identity, attendance, party-line loyalty, and an actual deviation appear together.

## Motion and arguments

Capture routes:

- Top phone: `AppStoreScreenshotDestination.vote("2026-01-29-993-streichung-des-straftatbestandes-der-politikerbeleidigung")`
- Bottom phone: `AppStoreScreenshotDestination.vote("2025-12-05-984-gesetzentwurf-zur-modernisierung-des-wehrdienstes")`

Sources:

- `iphone-antrag-zusammenfassung.png`
- `iphone-mitgliederdebatte.png`

Output: `03-iphone-65-antrag-argument.png`

Copy:

| Locale | Headline | Highlights |
|---|---|---|
| `de-DE` | Anträge verstehen und Argumente vergleichen | `Anträge`, yellow `#f4d84f`; `Argumente`, coral `#ff9c7c` |
| `en-US` | Understand motions and compare arguments | `motions`, yellow `#f4d84f`; `arguments`, coral `#ff9c7c` |

Top app state: `Details` is selected for `Streichung des Straftatbestandes der Politikerbeleidigung`, dated 29 January 2026. The crop exposes `Was sich ändern soll`, including the bullets that remove the special offence for insulting politicians and treat those insults like insults against private individuals. English renders the same state in localized app UI.

Bottom app state: `Reden` or `Speeches` is selected for `Gesetzentwurf zur Modernisierung des Wehrdienstes`, dated 5 December 2025. The final scroll position shows the actual member timeline: a Siemtje Möller speech bubble, Julia Klöckner's parliamentary interjections, then member bubbles for Rüdiger Lucassen and Norbert Röttgen. Party summary cards are outside the crop and must never replace the conversation.

Composition: solid pale blue `#dcecff`, ink `#12213b`. The top phone enters from above-left at x 137, y -1330, width 1010, rotated -4 degrees. The 132 px centered headline sits at x 70, y 890, width 1144. The bottom phone enters from below-right at x 137, y 1500, width 1010, rotated 4 degrees. There are no callouts.

```text
+------------------------------------------------+
|  /  Details                                  / |
| /  WAS SICH ÄNDERN SOLL                     /  |
|/  • Besonderen Straftatbestand streichen  /   |
|  • Beleidigungen künftig gleich behandeln/   |
|        [ANTRÄGE] verstehen und                 |
|        [ARGUMENTE] vergleichen                 |
|              / Reden                         / |
|             / . Siemtje Möller · SPD .     /  |
|            /  ---- Julia Klöckner ----    /   |
|           /   . Rüdiger Lucassen · AfD . /   |
|          /  ---- Julia Klöckner ----    /     |
|         /   . Norbert Röttgen · CDU/CSU /    |
+------------------------------------------------+
```

Interactions represented: Details scroll through the motion summary, while Speeches scrolls through member conversation bubbles and procedural interjections.

Emphasis: one composition connects what a motion changes with the people and parliamentary exchange behind a different vote.

## Party comparison

Capture route: `AppStoreScreenshotDestination.parties`

Source: `iphone-parteivergleich.png`

Output: `04-iphone-65-parteien.png`

Copy:

| Locale | Headline | Highlight |
|---|---|---|
| `de-DE` | Parteien im Vergleich | `Vergleich`, white `#ffffff` |
| `en-US` | Compare the parties | `Compare`, white `#ffffff` |

App state: Parties list at the top of the screen. The seat map leads into `REGIERUNG · 328 VON 630 SITZEN` and `OPPOSITION · 299 SITZE`, followed by party rows for CDU/CSU, SPD, AfD, B90/Grüne, and Die Linke with seats, cohesion, and attendance. English uses the exact localized captions `GOVERNMENT · 328 OF 630 SEATS` and `OPPOSITION · 299 SEATS`.

Composition: solid yellow `#f4e36c`, ink `#17212b`. The 128 px headline sits top-left at x 56, y 80, width 1172. Two elevated white callouts stack at x 40, y 770 in the left negative space. A phone enters from the right at x 398, y 500, width 980, rotated 4 degrees.

Callouts:

- Top: `328 REGIERUNG` or `328 GOVERNMENT`, blue border `#4f6f91`, rotated -3 degrees.
- Bottom: `299 OPPOSITION`, red border `#b94f61`, rotated 3 degrees.

Decision: use the 328 government and 299 opposition totals. They are the strongest list-level callouts because they repeat the coalition arithmetic established by the seat map and section captions, while the former cohesion and attendance values described only one party detail screen that is no longer shown.

```text
+------------------------------------------------+
| Parteien im [VERGLEICH]                        |
|                                                |
|                    /--------------------------.|
|                   /      . . . . . . .        ||
|  / 328           /    . . . . . . . .         ||
| / REGIERUNG     / REGIERUNG · 328/630        ||
|/              / CDU/CSU 208 · G100 · A95    ||
|               / SPD     120 · G100 · A94    ||
| / 299        /                                ||
|/ OPPOSITION / OPPOSITION · 299 SITZE         ||
|            / AfD     150 · G99 · A87        ||
|           / B90/Grüne 85 · G99 · A89       ||
|          /  Die Linke 64 · G100 · A82       ||
|         /                                     ||
+------------------------------------------------+
```

Interactions represented: each party row opens its profile; the seat map and government or opposition grouping remain visible context.

Emphasis: coalition arithmetic is visible at a glance, then party rows show who holds those seats.

## Assets

Each locale directory contains these five 1284 x 2778 px source captures:

- `fastlane/screenshot-source/<locale>/iphone-aktuelle-abstimmung.png`
- `fastlane/screenshot-source/<locale>/iphone-antrag-zusammenfassung.png`
- `fastlane/screenshot-source/<locale>/iphone-mitgliederdebatte.png`
- `fastlane/screenshot-source/<locale>/iphone-abgeordneten-stimmen.png`
- `fastlane/screenshot-source/<locale>/iphone-parteivergleich.png`

Each locale directory contains these four final 1284 x 2778 px PNGs, in upload order:

- `fastlane/screenshots/<locale>/01-iphone-65-heute.png`
- `fastlane/screenshots/<locale>/02-iphone-65-abgeordneten.png`
- `fastlane/screenshots/<locale>/03-iphone-65-antrag-argument.png`
- `fastlane/screenshots/<locale>/04-iphone-65-parteien.png`

Locales are `de-DE` and `en-US`, producing ten source captures and eight final PNGs.

## Renderer measurements

- Headline: Fraunces semibold, 132 px by default, 140 px for member accountability, and 128 px for party comparison, line-height 0.96. Highlight spans use 12 px horizontal padding, 7 px bottom padding, and 8 px radius.
- Current decision: headline x 56, y 96, width 1172; callouts y 540; phone x 72, y 640, width 1140.
- Member accountability: phone x 112, y -140, width 1060; callouts y 1510; headline x 56, width 1172, y 2180 for `de-DE` and y 2290 for `en-US`.
- Motion and arguments: top phone x 137, y -1330, width 1010; headline x 70, y 890, width 1144; bottom phone x 137, y 1500, width 1010.
- Party comparison: headline x 56, y 80, width 1172; phone x 398, y 500, width 980; callouts x 40, y 770.
- Device: `#101010` frame, 24 px padding, 126 px outer radius, 102 px image radius, and shadow `0 44px 100px rgba(10, 10, 10, 0.25)`.
- Callout: white surface, 14 px colored left border, 14 px radius, padding `20px 24px 18px`, gap 16 px, and shadow `0 22px 50px rgba(10, 10, 10, 0.18)`. Value uses Fraunces at 58 px; label uses system sans at 24 px.
- The app captures retain the iOS 1.1 components and semantic result, party, success, and danger colors. The renderer adds only the solid canvas, headline, frame, and configured callouts.
