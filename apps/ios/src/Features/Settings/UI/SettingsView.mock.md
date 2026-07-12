# More

## Root, German

```text
+------------------------------------------+
| Machtblick                               |
+------------------------------------------+
|                                          |
| [globe]  Sprache              Deutsch  v |
|          ------------------------------  |
| [circle.lefthalf] Darstellung   System  v|
|          ------------------------------  |
| [building.columns]  Über die Daten     > |
|          ------------------------------  |
| [doc.text]          Impressum           > |
|          ------------------------------  |
| [hand.raised]       Datenschutz         > |
|          ------------------------------  |
| [arrow.clockwise]   Zuletzt aktualisiert  |
|                     11. Juli, 22:10       |
|          ------------------------------  |
| [square.and.arrow.up] Machtblick teilen   |
|                                          |
|              Version 1.0 (33)            |
+------------------------------------------+
|    [seal]     [people]     [pie] [sliders]|
+------------------------------------------+
```

## Root, English

```text
+------------------------------------------+
| Machtblick                               |
+------------------------------------------+
|                                          |
| [globe]  Language              English  v|
|          ------------------------------  |
| [circle.lefthalf] Appearance    System  v|
|          ------------------------------  |
| [building.columns]  About the data     > |
|          ------------------------------  |
| [doc.text]          Imprint            > |
|          ------------------------------  |
| [hand.raised]       Privacy            > |
|          ------------------------------  |
| [arrow.clockwise]   Last updated          |
|                     Jul 11, 10:10 PM      |
|          ------------------------------  |
| [square.and.arrow.up] Share Machtblick    |
|                                          |
|              Version 1.0 (33)            |
+------------------------------------------+
|    [seal]     [people]     [pie] [sliders]|
+------------------------------------------+
```

The first toolbar item is the existing `BrandWordmark`. It begins as the Machtblick wordmark and uses the same scroll morph as Votes, Members, and Parties. There is no More title, hero, slogan, description, section card, or trailing toolbar action.

All four root tabs are icon-only. Their SF Symbols are `checkmark.seal`, `person.2`, `chart.pie`, and `slider.horizontal.3`. Localized tab names remain available to VoiceOver and system accessibility surfaces.

## Language menu

```text
                         +----------------+
                         | System         |
                         | Deutsch       ✓|
                         | English        |
                         +----------------+
```

The Language row is a native trailing `Menu` picker. Its closed value is exactly `System`, `Deutsch`, or `English`. The choices keep their own names in both app languages. Selecting an option updates all app copy immediately. `System` resolves to German only when the phone's first preferred language is German, and to English otherwise. It does not add a second explanatory line.

## Appearance menu

```text
                         +----------------+
                         | System        ✓|
                         | Hell            |
                         | Dunkel          |
                         +----------------+
```

The Appearance row is a native trailing `Menu` picker. Its choices are `System`, `Hell`, and `Dunkel` in German and `System`, `Light`, and `Dark` in English. `System` is the default and follows the iPhone appearance. Explicit Light and Dark choices update the whole app immediately and persist across launches.

The semantic canvas tokens adapt to the selected appearance. Light keeps the existing white, off-white, and elevated gray hierarchy. Dark uses black, `#1C1C1E`, and `#2C2C2E`; foreground becomes white. Borders and secondary text remain derived from `fg`. Accent and party colors keep their existing meaning in both appearances.

## Tokens

- Preference, navigation, and share labels use text `l`; freshness copy uses text `m`; the version uses text `s`.
- Row icons use icon `m`, navigation chevrons use icon `s`, and the icon column uses icon `l` width.
- Rows use spacing `m` between icon and copy plus spacing `l` vertically.
- Dividers use stroke `s`, border opacity `s`, and the existing inset after the icon column.
- Selected values, supporting text, chevrons, and the version use secondary opacity `l`.

## Pushed native page

```text
+------------------------------------------+
| < Mehr                                   |
+------------------------------------------+
|                                          |
| Über die Daten                           |
|                                          |
| DATENQUELLEN                             |
|   Bundestag Open Data                    |
|   bundestag.de                    [link] |
|   Namentliche Abstimmungen und           |
|   Stammdaten der Abgeordneten (XML)      |
|                                          |
|   DIP                                    |
|   dip.bundestag.de                [link] |
|   Metadaten zu Anträgen und              |
|   Drucksachen über die DIP-API           |
|                                          |
| AKTUALISIERUNG                           |
| Die Daten werden wöchentlich über eine   |
| automatisierte Pipeline aktualisiert.    |
|                                          |
| KI-HINWEIS                               |
| Zusammenfassungen und vereinfachte       |
| Titel basieren auf den offiziellen ...   |
|                                          |
| BETREIBER                                |
| Machtblick ist ein Projekt von Ahmed     |
| Soliman. Alle Angaben zum Betreiber      |
| stehen im Impressum.              [link] |
|                                          |
+------------------------------------------+
|    [seal]     [people]     [pie] [sliders]|
+------------------------------------------+
```

The page is a native push inside the More tab's `NavigationStack`. The back label is localized to `Mehr` or `More`. The bottom root tab bar remains visible. The content scrolls independently and does not repeat the `BrandWordmark` or add a web-style header and footer.

The reading hierarchy is shared by all three destinations:

```text
display title

SMALL UPPERCASE SECTION CAPTION
body copy at a comfortable reading measure

  source or contact name
  linked address
  quiet supporting detail

next section
```

German page order:

```text
Über die Daten
  Datenquellen
  Aktualisierung
  KI-Hinweis
  Betreiber

Impressum
  Was ist Machtblick
  Datenquellen
    Deutscher Bundestag
    abgeordnetenwatch
    Bilder
  Grundsätze
  Kontakt
  Zur Person

Datenschutz
  Diese Seite erhebt keine personenbezogenen Daten ...
  Stand: 14. Mai 2026
```

English page order:

```text
About the data
  Data sources
  Updates
  AI notice
  Operator

Imprint
  What Machtblick is
  Data sources
    German Bundestag
    abgeordnetenwatch
    Images
  Principles
  Contact
  About the operator

Privacy
  This site does not collect personal data ...
  Last updated: May 14, 2026
```

All headings, paragraphs, sources, descriptions, dates, links, and contact addresses match the corresponding localized website page exactly. External source and operator links open in the in-app browser. Email addresses use native mail links. Internal links between About the data, Imprint, and Privacy push the matching native page.

## Visual contract

- The canvas and toolbar are `background`, with no grouped-list gray, cards, shadows, pills, or decorative accent color.
- Root content uses `l` horizontal padding. Rows use at least a 44 point tap target, `m` icon-to-label spacing, `m` icons, `s` chevrons, and `l` body text.
- Hairline dividers are `fg` at `opacity-s` and begin after the icon column. Section separation comes from `xl` whitespace.
- The Language and Appearance values, freshness timestamp, chevrons, link metadata, and version use `secondary`. The version is centered, `text-s`, and visually quiet.
- Reading pages use `display-xxl` for the title, `text-s` captions, and `text-m` prose. Website source group indentation maps to `m` spacing. Links are underlined rather than colored.
- Data freshness and sharing directly follow Privacy without a flexible gap. All rows remain reachable through scrolling at large Dynamic Type sizes.
- SF Symbols are decorative within labeled rows. Each row is one full-width accessibility element with its localized label, value, and button or link trait.
