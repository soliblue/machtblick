# /members/:id

Plan 121 simplifies the member profile around voting history and speeches. The
member-specific Anträge surface and voting filters are removed.

## Header

```text
+------------------------------------------+
| ( PORTRAIT )  [SPD] Erika Musterfrau     |
| (  circle  )  Niedersachsen              |
| (  112px  )  Landesliste                 |
|               41 Jahre                   |
|                                          |
|      86%                  94%             |
|  ANWESENHEIT          LINIENTREUE         |
| 8 VON 57 VERPASST    3 ABWEICHUNGEN      |
|                                          |
| [      Abstimmungen      ][    Reden    ] |
+------------------------------------------+
```

- The circular portrait is 112px on mobile and 128px on desktop. A small
  overlaid info button opens the complete linked photo attribution on hover,
  focus, or tap.
- Mobile keeps portrait and identity in two columns. Stats span both columns.
- Desktop keeps the portrait in the left column and places identity and stats
  in the right column.
- Identity metadata is stacked for narrow widths and may wrap at word
  boundaries. The party logo sits directly before the member name.
- Attendance and loyalty use centered percentage values with labels and
  supporting counts below. They have no chart or progress bar.
- A nonzero deviation count toggles `?line=abw`. The active count is semibold,
  and no separate filter controls appear above the vote list.
- The tab selector uses a bordered `surface` track and active white segment.
  Only Abstimmungen and Reden remain, without counts.

## Abstimmungen

```text
+------------------------------------------+
| [GRUENE]                       ABGELEHNT |
|                                          |
| Ein allgemeines Tempolimit von 130 km/h  |
| einfuehren                               |
|                                          |
| STIMME [NEIN]  /  ABWEICHUNG  v          |
|                                          |
| (o)    (o)    (o)    (o)    ((o))       |
| GRUENE LINKE CDU/CSU  AFD     SPD         |
+------------------------------------------+
```

The compact card inherits proposer, result stamp, title, and party donuts
from the normal `/votes` card. Summary and hemicycle are removed. The member's
ballot is the lead signal. A matching ballot shows `LINIE` in success green; a
different ballot shows `ABWEICHUNG` in danger red. The member's party donut is
outlined using the majority choice color. No vote
or line filters remain. The unframed status row is centered and its connector
always exits from the center of the bottom edge.
Vote titles use language-aware native hyphenation with the route locale.

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

## Desktop

The same content order is retained inside `max-w-3xl`. Desktop does not add
profile cards or a second information architecture. The debate dialog gains a
bounded centered surface while the member list and tabs retain web scrolling.
Compact vote cards remain single-column so their hierarchy matches mobile.
Legacy member motions URLs redirect to the voting page.

## Tokens

| Element | Contract |
|---|---|
| Portrait | 112px mobile, 128px desktop, circular |
| Name | xxl display semibold |
| Metadata | s caption, stacked, fg at opacity-l |
| Stats | two centered values with labels and supporting counts |
| Tabs | `rounded-s` track, xs gap and padding |
| Vote item | unframed bg-background, p-l, elevated inset divider |
| Member ballot | s caption, semantic filled badge |
| Party majority | highlighted donut, semantic caption |
| Inbox title | l display semibold |
| Speech prose | m Lora |

The profile remains a person-first surface. Party color is reserved for
identity and speech context, not decorative profile chrome.
