# /votes/:id

Route: `/votes/:id`

Plan 114 parity contract. The iOS vote detail is the accepted reference for
result anatomy, segmented selection, party summary bubbles, and debate
conversation. Web keeps URL-addressable tabs where useful, but the visible
control should read like a segmented control, not a bordered route table.

## Mobile

```
+---------------------------------------------+
| Machtblick                               =  |
|                                             |
| CDU/CSU                 [ ANGENOMMEN ]  25.6|
| Krankenhausversorgung sichern              |
| Offizieller Titel: Antrag der Fraktionen... |
|                                             |
| Vorgelegt von  (foto)(foto)(foto)(+8)       |
|                                             |
| Die Vorlage soll die Finanzierung stabil... |
|                                             |
| +-----------+-----------+-----------+       |
| | Ergebnis  | Details   | Reden     |       |  segmented control
| +-----------+-----------+-----------+       |
|                                             |
|              . o o o o o o .               |
|          o o o o o o o o o o o             |
|       o o o o o o + + . . x x x x          |
|     o o o o o o o + + . . x x x x x        |
|                                             |
|   JA          53 ENTHALTUNG          NEIN   |
|   318         34 ABWESEND            225    |
|                                             |
| FRAKTIONEN                                  |
| (( O ))     (( O ))     (( o ))             |
| CDU/CSU     SPD         Linke               |
| Ja 189      Ja 120      Enth 44             |
| Nein 5      Abw 8       Nein 14             |
|                                             |
| (( o ))     (( . ))                         |
| Gruene      AfD                             |
| Nein 71     Nein 149                        |
| Ja 3        Abw 3                           |
|                                             |
| ABWEICHUNGEN                                |
| CDU/CSU  Linie JA  9 von 197                |
| ------------------------------------------- |
| (foto) Max Mustermann              [ NEIN ] |
| (foto) Erika Musterfrau        [ ENTHALTEN ]|
|                                             |
| Quelle: offizielle Daten des Bundestages -> |
+---------------------------------------------+
```

## Desktop

```
+----------------------------------------------------------------------+
| Machtblick        Abstimmungen  Abgeordnete  Fraktionen      Deutsch |
|                                                                      |
| CDU/CSU                         [ ANGENOMMEN ]              25.06.26 |
| Krankenhausversorgung sichern                                      |
| Offizieller Titel: Antrag der Fraktionen ...                       |
| Vorgelegt von (foto)(foto)(foto)(foto)(+8)                         |
|                                                                      |
| Die Vorlage soll die Finanzierung stabilisieren und ...             |
|                                                                      |
| +-------------------+-------------------+-------------------+        |
| | Ergebnis          | Details           | Reden             |        |
| +-------------------+-------------------+-------------------+        |
|                                                                      |
| ERGEBNIS                                                            |
|                                                                      |
|                        . o o o o o o o o .                          |
|                  o o o o o o o o o o o o o o o                      |
|             o o o o o o o o + + + . . . x x x x x x                 |
|                                                                      |
|          JA              53 ENTHALTUNG                NEIN           |
|          318             34 ABWESEND                  225            |
|                                                                      |
| FRAKTIONEN                                                          |
| (( O ))     (( O ))     (( o ))     (( o ))     (( . ))              |
| CDU/CSU     SPD         Linke       Gruene      AfD                  |
| Ja 189      Ja 120      Enth 44     Nein 71     Nein 149             |
| Nein 5      Abw 8       Nein 14     Ja 3        Abw 3                |
|                                                                      |
| ABWEICHUNGEN                                                        |
| CDU/CSU  Linie JA  9 von 197 -------------------------------------- |
| (foto) Max Mustermann      [ NEIN ]   (foto) Paula Probe  [ NEIN ]  |
| (foto) Erika Musterfrau [ENTHALTEN]   ( MM ) Moritz M.    [ NEIN ]  |
|                                                                      |
| Quelle: offizielle Daten des Bundestages ->                         |
+----------------------------------------------------------------------+
```

Desktop may use the wider single-row party donut layout and a two-column
defector grid. It does not copy native navigation-stack behavior, haptics, or
pull to refresh.

## Reden Panel

```
+---------------------------------------------+
| PARTEI-ZUSAMMENFASSUNGEN  5                 |
|                                             |
| < .--------------------------. .-------- > |
|   | [CDU/CSU]     (a)(b)(c) | | [SPD]     |
|   | Die Fraktion stuetzt das | | Die       |  subdued party tint
|   | Paket, betont aber ...   | | Fraktion  |  horizontal scroll, 300px each
|   '--------------------------' '--------   |
|                                             |
| DEBATTENVERLAUF                             |
| [ Suche in Reden........................ ] |
|                                             |
| ------------------------------------------- |
| Praesidium: Aussprache wird eroeffnet.       |
| ------------------------------------------- |
|                                             |
| .-----------------------------------------. |
| | (foto) Max Mustermann          CDU/CSU  | |
| | Sehr geehrte Frau Praesidentin, ...     | |
| | Mehr anzeigen                           | |  inline expansion
| '-----------------------------------------' |
|      .------------------------------------. |
|      | (foto) Erika Musterfrau      SPD   | |
|      | Zwischenfrage: Wie bewerten Sie... | |
|      '------------------------------------' |
+---------------------------------------------+
```

Party summaries are fully expanded horizontal bubbles, 320px on mobile and 400px on desktop. Each bubble shows
the party logo at left, participating speaker avatars at right, and the complete
position summary below. The logo links to the party page. There is no stance
stamp, clamp, expand action, or reader action on a party summary.
Every bubble in a summary rail uses the height of the longest summary in that rail.

The vote-detail header keeps party, result stamp, save, and seen controls. It does not show the vote date.

Speech turns expand inline. Presidium and procedural contributions render as
full-width rule rows between bubbles.

## Filters / interactions

- The segmented control switches Ergebnis, Details, and Reden. On web the same
  state may remain URL-addressable through search params or route handling.
- The hemicycle legend is the vote-choice filter. JA, NEIN, ENTHALTUNG, and
  ABWESEND are toggle buttons. Active choice dims non-matching seats and party
  donut segments.
- Party donuts link to party pages and expose full tallies with Tooltip.
- Defector rows link to member vote records. Group headers link to the party
  vote context.
- Debate search filters visible turns and keeps match-centered snippets inside the
  conversation bubbles.
- Speech bubbles expand inline. Modal reader may remain as a secondary escape
  hatch for long text, but not as the default interaction.

## What This Emphasizes

At a glance: the chamber split, which parties moved together, and who broke
with their line before the user reads the debate.

## Tokens

| Element | Size / weight | Spacing | Component |
|---|---|---|---|
| Page title | xl display semibold | mt-m | h1 |
| Meta caption | s uppercase regular opacity-l | gap-s | PartyBadge, Stamp |
| Segmented control | m regular, active semibold | mb-l | Tabs styled as segmented |
| Section captions | s uppercase regular opacity-l | mb-s | none |
| Hemicycle numerals | poster 32, hero 40 display semibold tabular | gap-m | shared hemicycle |
| Party donut grid | s labels, s tabular counts | gap-l | Tooltip |
| Defector group header | s regular opacity-l, chip semibold | pb-s | PartyLogo |
| Defector row | m regular | py-s, gap-m | VoteChoicePill |
| Party summary bubble | l Lora serif regular | p-m, gap-s, 320/400px | AvatarPile |
| Speech bubble | l Lora serif regular | p-m, gap-s | SpeakerAvatar |
| Party surface tint | none | shared across both bubble types | semantic party surface |
| System row | s regular opacity-l | py-m | rule rows |

Colors: party color only for identity tint and party logo. Both party-summary and
conversation bubbles use one shared surface tint with a lower effective party
opacity than the current 13% mix. The tint stays quiet against `background` in
light and dark appearances. Party logos and small party-colored actions keep their
full identity color. Vote outcomes use success and danger. Abstention uses yellow.
Neutral facts use foreground opacity. Bubbles use the existing radius-m token.
