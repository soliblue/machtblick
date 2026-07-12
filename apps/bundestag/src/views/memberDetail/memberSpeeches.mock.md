# Member speeches tab

Route: `/members/:id/speeches`

Plan 114 parity contract. The list unit is a debate appearance, not a raw XML
speech fragment. Rows use the iOS inbox anatomy and open the full debate with
this member highlighted. Speech turns expand inline inside the debate.

## Mobile

```
+---------------------------------------------+
| (foto) Erika Musterfrau                     |
| Erika Musterfrau                            |
| SPD / Hessen / Direktmandat                 |
|                                             |
| +-------------------+-------------------+   |
| | Abstimmungen      | Reden             |   |
| +-------------------+-------------------+   |
|                                             |
| [ Reden durchsuchen..................... ]  |
|                                             |
| Krankenhausversorgung sichern              |
| 25.06.2026 / 6 Beitraege / 3 kurz          |
| .-----------------------------------------. |
| | Die Finanzierung muss in der Flaeche... | |  subdued party tint
| '-----------------------------------------' |
| Ganze Debatte ansehen >                     |
| ------------------------------------------- |
| Aktuelle Stunde: Pflege                    |
| 12.06.2026 / 1 Beitrag                     |
| .-----------------------------------------. |
| | Danke, Frau Praesidentin. Wir muessen...| |
| '-----------------------------------------' |
| Ganze Debatte ansehen >                     |
+---------------------------------------------+
```

Opening a row:

```
+---------------------------------------------+
| Krankenhausversorgung sichern          X    |
|                                             |
| ------------------------------------------- |
| Praesidium: Aussprache wird eroeffnet.       |
| ------------------------------------------- |
|                                             |
| .-----------------------------------------. |
| | (foto) Max Mustermann          CDU/CSU  | |
| | Wir unterstuetzen die Vorlage, weil ... | |
| '-----------------------------------------' |
| .=========================================. |
| | (foto) Erika Musterfrau          SPD    | |  highlighted member
| | Die Finanzierung muss in der Flaeche... | |
| | Mehr anzeigen                           | |
| '=========================================' |
|      .------------------------------------. |
|      | (foto) Paul Probe          Gruene | |
|      | Zwischenfrage: Wie soll das ...   | |
|      '------------------------------------' |
+---------------------------------------------+
```

## Desktop

```
+----------------------------------------------------------------------+
| Header and segmented member tabs stay above this panel                |
|                                                                      |
| [ Reden durchsuchen................................................] |
|                                                                      |
| Krankenhausversorgung sichern                          25.06.2026    |
| 6 Beitraege / 3 kurz                                                |
| .------------------------------------------------------------------. |
| | Die Finanzierung muss in der Flaeche verlaesslich sein ...       | |
| '------------------------------------------------------------------' |
| Ganze Debatte ansehen >                                             |
| -------------------------------------------------------------------- |
| Aktuelle Stunde: Pflege                               12.06.2026    |
| 1 Beitrag                                                            |
| .------------------------------------------------------------------. |
| | Danke, Frau Praesidentin. Wir muessen die Einrichtungen ...      | |
| '------------------------------------------------------------------' |
| Ganze Debatte ansehen >                                             |
+----------------------------------------------------------------------+
```

Desktop keeps the same row anatomy and may present the opened debate as a
centered dialog or route-backed panel. It must preserve content order, inline
speech expansion, and the highlighted member state. Native full-screen cover and
haptics are not copied literally.

## Filters / interactions

- Search matches title, agenda labels, speaker names, and all underlying
  contribution text. Results remain grouped by debate appearance.
- Short replies never stand alone in the list. They appear inside the opened
  debate near their surrounding turns.
- Row action opens the full debate. The current member's turns are highlighted.
- Speech turns expand inline with "Mehr anzeigen". The separate reader is not
  the primary interaction.
- If the debate is tied to a vote, the opened surface includes a contextual vote
  link but does not replace the conversation.

## What This Emphasizes

At a glance: where this member actually appeared in parliamentary debates, with
their own contribution visible before procedural fragments.

## Tokens

| Element | Size / weight | Spacing | Component |
|---|---|---|---|
| Search input | m regular | px-m py-s | Input anatomy |
| Inbox title | l display semibold | mb-s | button row |
| Inbox meta | s regular opacity-l | gap-s | none |
| Excerpt bubble | l Lora serif regular | p-m | party-tinted bubble |
| Row divider | none | py-m | border fg opacity-s |
| Open action | s semibold | mt-s | Button text |
| Debate title | l display semibold | p-l | dialog or route header |
| Speech bubble | l Lora serif regular | p-m | SpeakerAvatar, PartyLogo |
| Party surface tint | none | shared with vote-detail debates | semantic party surface |
| Highlight ring | none | stroke-m | member highlight |
| System row | s regular opacity-l | py-m | full-width rules |

Colors: party tint is identity for debate context only. Excerpt and conversation
bubbles follow `views/speeches/speeches.mock.md`: the approved quiet wash in
Light, then an opaque `surface` base, party overlay at opacity-s, and party
stroke-s border at opacity-m in Dark. Party logos and small party-colored actions
keep full identity color. The highlighted-member ring replaces the ordinary
border with party color at opacity-l. Neutral metadata uses foreground opacity-l.
