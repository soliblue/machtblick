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

- Top phone: `AppStoreScreenshotDestination.vote("pp21-74-13-gesetzentwurf-zur-weiterentwicklung-der-treibhausgasminderungs-quote-schlussabst")`
- Bottom phone: `AppStoreScreenshotDestination.vote("2026-04-24-999-gesetzentwurf-zur-temporaren-absenkung-der-energiesteuer-fur-kraftstoffe")`

Sources:

- `iphone-antrag-zusammenfassung.png`
- `iphone-fraktionsargumente.png`

Output: `03-iphone-65-antrag-argument.png`

Copy:

| Locale | Headline | Highlights |
|---|---|---|
| `de-DE` | Anträge verstehen und Argumente vergleichen | `Anträge`, yellow `#f4d84f`; `Argumente`, coral `#ff9c7c` |
| `en-US` | Understand motions and compare arguments | `motions`, yellow `#f4d84f`; `arguments`, coral `#ff9c7c` |

Top app state: `Details` is selected for `Strengere Klimapflichten für Kraftstoffanbieter bis 2040`, dated 23 April 2026. The final composition exposes the lower summary bullets under `Was sich ändern soll`, including the 59 percent 2040 duty, synthetic-fuel quota, advanced-biofuel quota, and palm-oil exclusion.

Bottom app state: `Reden` or `Speeches` is selected for the temporary fuel-tax reduction vote. Before capture, the UI test drags from 84 to 50 percent screen height so `FRAKTIONEN IM ÜBERBLICK · 5` or `DEBATE AT A GLANCE · 5` and the party argument cards fill the visible area.

Composition: solid pale blue `#dcecff`, ink `#12213b`. The top phone enters from above-left at x 137, y -1330, width 1010, rotated -4 degrees. The 132 px centered headline sits at x 70, y 890, width 1144. The bottom phone enters from below-right at x 137, y 1500, width 1010, rotated 4 degrees. There are no callouts.

```text
+------------------------------------------------+
|  /  Details                                  / |
| /  WAS SICH ÄNDERN SOLL                     /  |
|/  • Pflicht steigt bis 2040 auf 59 Prozent /   |
|  • Quote für synthetische Kraftstoffe      /   |
|        [ANTRÄGE] verstehen und                 |
|        [ARGUMENTE] vergleichen                 |
|              / Reden                         / |
|             / FRAKTIONEN IM ÜBERBLICK · 5  /  |
|            / + CDU/CSU +      + SPD +      /   |
|           /  Entlastung       direkte Hilfe/   |
|          /                                  /   |
|         /                                  /    |
+------------------------------------------------+
```

Interactions represented: Details scroll through the motion summary, while the horizontal party strip compares five positions and links to party profiles.

Emphasis: one composition connects what a motion changes with how parliamentary groups argue about it.

## Party comparison

Capture route: `AppStoreScreenshotDestination.party("cdu-csu")`

Source: `iphone-parteivergleich.png`

Output: `04-iphone-65-parteien.png`

Copy:

| Locale | Headline | Highlight |
|---|---|---|
| `de-DE` | Parteien im Vergleich | `Vergleich`, white `#ffffff` |
| `en-US` | Compare the parties | `Compare`, white `#ffffff` |

App state: CDU/CSU detail at the top of the profile. The source shows `REGIERUNG · 208 SITZE`, 100 percent cohesion, 95 percent attendance, demographics, 17 of 17 accepted motions, agreement rows, and major donations. English renders the same data in English app UI.

Composition: solid yellow `#f4e36c`, ink `#17212b`. The 128 px headline sits top-left at x 56, y 80, width 1172. Two elevated white callouts stack at x 40, y 770 in the left negative space. A phone enters from the right at x 398, y 500, width 980, rotated 4 degrees.

Callouts:

- Top: `100 % GESCHLOSSENHEIT` or `100% COHESION`, blue border `#4f6f91`, rotated -3 degrees.
- Bottom: `95 % ANWESENHEIT` or `95% ATTENDANCE`, green border `#3f8d58`, rotated 3 degrees.

```text
+------------------------------------------------+
| Parteien im [VERGLEICH]                        |
|                                                |
|                    /--------------------------.|
|                   / CDU/CSU                   ||
|  / 100 %         / REGIERUNG · 208 SITZE     ||
| / GESCHLOSSEN-  /                             ||
|/ HEIT /        / 100 %             95 %       ||
|              /  GESCHL.            ANWES.     ||
| / 95 %      /                                 ||
|/ ANWESEN-  /  76 %               39 %         ||
|  HEIT /   /   MÄNNLICH           50 BIS 59    ||
|          /   ANTRÄGE 17 / 17                  ||
|         /    SPD 100 % · GRÜNE 47 %           ||
|        /     GROSSSPENDEN                      ||
+------------------------------------------------+
```

Interactions represented: the proposals bar opens the party's motions, while agreement rows compare CDU/CSU with every other parliamentary group.

Emphasis: cohesion and attendance survive thumbnail viewing while the phone supplies the wider party comparison.

## Assets

Each locale directory contains these five 1284 x 2778 px source captures:

- `fastlane/screenshot-source/<locale>/iphone-aktuelle-abstimmung.png`
- `fastlane/screenshot-source/<locale>/iphone-antrag-zusammenfassung.png`
- `fastlane/screenshot-source/<locale>/iphone-fraktionsargumente.png`
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
