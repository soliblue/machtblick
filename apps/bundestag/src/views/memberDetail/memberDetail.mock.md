# /members/:id

Plan 114 aligns the member profile with the current iOS identity header,
segmented navigation, and speech inbox while preserving URL-backed web tabs.

## Header

```text
+------------------------------------------+
| ( PORTRAIT )  Erika Musterfrau           |
| (  circle  )  SPD                       |
| (  112px  )  Niedersachsen              |
|               Landesliste                |
|               41 Jahre                   |
|                                          |
| ANWESENHEIT          LINIENTREUE         |
| 86%                  94%                 |
| [############---]    [##############-]   |
| 8 VON 57 VERPASST    3 ABWEICHUNGEN >    |
|                                          |
| [Abstimmungen][ Reden ][ Antraege ]      |
| [     57     ][   22  ][    30    ]      |
+------------------------------------------+
```

- The circular portrait is 112px on mobile and 128px on desktop.
- Mobile keeps portrait and identity in two columns. Stats span both columns.
- Desktop keeps the portrait in the left column and places identity and stats
  in the right column.
- Identity metadata is stacked for narrow widths and may wrap at word
  boundaries. The party is a text label in this compact header.
- Attendance and loyalty remain the two poster metrics. Defections link into
  the filtered vote tab.
- The tab selector uses a bordered `surface` track and active white segment.
  Counts remain visible and every tab retains its own URL.

## Abstimmungen

```text
| STIMMVERHALTEN                           |
| [###JA###|#######NEIN#######|#|.]        |
| 12 JA  38 NEIN  3 ENTHALTEN  4 FEHLEND  |
| [Linie] [Stimme]                         |
|------------------------------------------|
| [ NEIN ]  Bundeswehreinsatz im Libanon  |
|           25. JUN 2026  ANGENOMMEN       |
|------------------------------------------|
| [  JA  ]  Buergergeld-Reform             |
|           ABWEICHEND VON LINIE NEIN      |
```

The member's ballot is the lead signal. Chamber outcome and date remain quiet
metadata. Existing vote and line filters remain URL-backed.

## Reden

```text
| [ o  Reden durchsuchen................ ] |
|------------------------------------------|
| BAfoeG-Reform: Bildung bezahlbar machen  |
| 11. JUN 2026  6 BEITRAEGE  2 KURZ       |
| "Sehr geehrte Frau Praesidentin ..."    |
|                         GANZE DEBATTE >  |
|------------------------------------------|
| Aktuelle Stunde: Mietenpolitik           |
| 22. MAI 2026  1 BEITRAG                 |
```

- Each grouped appearance is an inbox row with title, date, contribution
  counts, excerpt, and an explicit full-debate command.
- The full debate opens in a full-screen mobile dialog and centered desktop
  dialog.
- The selected member's contribution is highlighted in the shared debate
  thread. Speech prose uses Lora and expands inline.
- Additional groups load in batches as the user reaches the end of the list.
- Search continues to operate across grouped contributions.

## Antraege

```text
| [ o  Antraege durchsuchen.............. ]|
| [Stand] [Abstimmung] [Kategorie]         |
|------------------------------------------|
| Kultur macht stark bis 2032 fortfuehren |
| NICHT BERATEN  11. JUN 2026             |
| 31 UNTERZEICHNER  [Kultur]              |
```

Proposal search, status filters, category filters, and links remain unchanged.
The segmented member navigation is the shared entry point for this tab.

## Desktop

The same content order is retained inside `max-w-3xl`. Desktop does not add
profile cards or a second information architecture. The debate dialog gains a
bounded centered surface while the member list and tabs retain web scrolling.

## Tokens

| Element | Contract |
|---|---|
| Portrait | 112px mobile, 128px desktop, circular |
| Name | xxl display semibold |
| Metadata | s caption, stacked, fg at opacity-l |
| Stats | two columns, display numeral, 6px success bar |
| Tabs | `rounded-s` track, xs gap and padding |
| Inbox title | l display semibold |
| Speech prose | m Lora |

The profile remains a person-first surface. Party color is reserved for
identity and speech context, not decorative profile chrome.
