# views/speeches (shared debate kit)

Reverse-documentation of the shipped, user-approved layout. This folder owns no
route; it is the app's debate component kit, consumed by three surfaces:

| Surface | Route | Uses |
|---|---|---|
| Speeches feed | `/speeches` (RedenSearch) | SpeechEntry, Reader, SpeakerAvatar |
| Vote / Antrag debate | `/votes/:id`, `/motions/:id` (SpeechesTab, DebateList) | DebateThread, ConversationBubble, ConversationSystemChip, AvatarPile, Reader |
| Member speeches | `/members/:id/...` (MemberSpeechesSection, MemberDebateDialog) | DebateThread, ConversationBubble, ConversationSystemChip |

The feed card state (SpeechEntry card layout) is specced in
`views/speechesSearch/speechesSearch.mock.md` and not repeated here. This file covers
the two states the kit itself defines: the **debate thread** (conversation state)
and the **reader** (full-text overlay).

## State 1: debate thread (mobile 390, inside a vote's Debatte section)

One component, both devices: the thread is a single centered column; desktop only
gains width (host container max-w), never a second layout. `buildDebateThread`
classifies rows: presidium speeches become system chips, everything else becomes
turns; a turn is nested when a different speaker interrupts and the floor speaker
returns within the next two turns.

```
+---------------------------------------------+
| FRAKTIONSPOSITIONEN · 5                     |  <- host caption: text-s caps
| .-------------------------. .-------------  |     opacity-l (voteDetail's
| | (SPD-logo)  (o)(o)(o)+2 | | (CDU-logo)    |     PartySummaryPreviewList,
| |                         | |               |     horizontal scroll rail;
| | Die Fraktion trägt den  | | Die Fraktion  |     AvatarPile from this kit:
| | Entwurf mit, weil ...   | | lehnt den ... |     32px circles overlapping
| '-------------------------' '-------------  |     -10px, +n overflow chip)
|                                             |
| DEBATTE ZUR ABSTIMMUNG                      |  <- caption text-s caps opacity-l
| [ (o) Reden durchsuchen................. ]  |  <- search input, hairline border
|                                             |
|  ---- Vizepräsidentin Muster · Das Wort --- |  <- ConversationSystemChip:
|  ----     hat Anna Beispiel.           ---- |     hairline rules both sides,
|                                             |     text-s opacity-l, name
| .-----------------------------------.       |     semibold, "Name · excerpt"
| | (o) Anna Beispiel         (logo)  |       |
| |                                   |       |  <- floor turn: pr-xl, bubble
| | „Wer heute in unseren Städten     |       |     hugs left. Bubble: radius-m,
| | eine Wohnung sucht, weiß, warum   |       |     p-m, bg = party surface tint
| | wir dieses Gesetz verlängern      |       |     (or `surface` if no party).
| | müssen. Die Mieten steigen ...“   |       |     Header: avatar 24 + name
| |                                   |       |     text-l semibold (link) +
| | Mehr anzeigen                     |       |     PartyLogo 17 right.
| '-----------------------------------'       |     Body: serif text-l, lh 1.45,
|                                             |     clamp 6 collapsed.
|       .-----------------------------------. |
|       | (o) Bernd Beispiel        (logo)  | |  <- nested interjection: pl-xl,
|       |                                   | |     bubble indented right, own
|       | „Gestatten Sie eine Frage: Wie    | |     party tint. Same anatomy.
|       | erklären Sie den Widerspruch?“    | |
|       '-----------------------------------' |
|                                             |
| .-----------------------------------.       |  <- floor speaker resumes left
| | (o) Anna Beispiel         (logo)  |       |
| | „Gern. Die Zahlen zeigen ...“     |       |
| | Mehr anzeigen                     |       |
| '-----------------------------------'       |
|                                             |
|  <  1  2  3  >                              |  <- host Pager, 15 rows per page
+---------------------------------------------+
```

- Rows stack in a flex column, gap-l.
- Expand: "Mehr anzeigen" / "Einklappen" text-s semibold in the party color
  (fg fallback), toggles clamp-6 to full text inline. Short contributions
  (contributionType `short`) get no expand affordance. While the full text loads,
  a text-s opacity-l loading line; if the shard has no text, a "Ganze Rede lesen"
  button (text-s, opacity-l) opens the Reader at that turn.
- Search hits render via snippet marks inside the bubble body.
- MemberDebateDialog variant: same thread inside a modal (full-screen mobile,
  centered max-w-3xl 85vh desktop, dim backdrop). Header: debate title
  font-display text-l semibold, date + "Zur Abstimmung" external link as a
  text-s caps caption, X close. The member's own bubbles get a 2px ring in
  their party color @ 70%; that ring is the "find me in this debate" device.

## Appearance states

The web and iOS conversation and party-summary bubbles share one appearance
contract. Light keeps the approved quiet party wash. Dark does not reuse that
low-alpha wash directly over black, because it erases party identity.

```text
LIGHT                              DARK
background                         background
.-------------------------.        .=========================.
| (o) Anna        SPD-logo |        || (o) Anna      SPD-logo ||
| Rede mit ruhigem         |        || Rede mit klarer,       ||
| Partei-Flaechenton       |        || ruhiger SPD-Toenung    ||
'-------------------------'        '========================='
 quiet party wash                    surface base + party tint
                                     + party hairline border
```

In Dark, each party bubble uses `surface` as its opaque base, a party-color
overlay at opacity-s, and a stroke-s party border at opacity-m. The border is
part of the identity surface, not a decorative accent. Party-less turns use
plain `surface` and the normal `fg` opacity-s border. Foreground text remains at
full contrast.

The highlighted-member state replaces the normal party border with the existing
stroke-l party ring at opacity-l. It must still read as stronger than an ordinary
dark bubble. Party logos remain full identity color. Vote-choice stamps retain
success, danger, and yellow, and never inherit the bubble party color.

## State 2: reader (full-speech overlay)

Opened from a feed card (/speeches) or a thread turn. Mobile = bottom sheet rising
to 64px below the top edge; desktop = the same panel as a centered dialog
(max-w-42rem, 85vh, radius-m, hairline border). Backdrop black @ 40%, click or
Esc closes, focus trapped.

```
+---------------------------------------------+
| (page dimmed, top 64px visible)             |
| .-----------------------------------------. |
| |                  ====                   | |  <- drag handle 36x4, mobile only
| |                                         | |
| | (foto) Anna Beispiel       /======/   x | |  <- avatar 36; name text-m
| |        (logo) SPD · BERICHTERSTATTERIN  | |     semibold (member link);
| |        27.06.2026 · Zur Abstimmung:     | |     PartyBadge 16 + role caption;
| |        Mietpreisbremse verlängern       | |     date · vote link text-s
| |-----------------------------------------| |     opacity-l. Ballot Stamp
| |                                         | |     straight (never rotated),
| | Frau Präsidentin! Meine Damen und       | |     only when the speaker cast
| | Herren! Wer heute in unseren Städten    | |     a ballot. X close 19.
| | eine Wohnung sucht, weiß, warum wir     | |
| | dieses Gesetz verlängern müssen. Die    | |  <- body: full text, serif
| | Mieten steigen schneller als die        | |     text-l, lh 1.45, pre-wrap,
| | Löhne, und die Mietpreisbremse ist      | |     scrolls; search terms
| | das einzige Instrument, das ...         | |     highlighted
| |                                         | |
| |-----------------------------------------| |
| | <      Beitrag 3 von 12      Weiter: B> | |  <- footer only when count > 1:
| '-----------------------------------------' |     chevrons 17, position text-s
+---------------------------------------------+     opacity-l, next speaker name
```

- Prev/next page through the host's turn sequence without closing; disabled
  ends at 30% opacity.
- Second header variant (party summary): PartyLogo 26 + party name text-m
  semibold, stance Stamp (DAFÜR / DAGEGEN / ENTHALTEN / GESPALTEN); body =
  position summary text-m, key points as markdown, dissent note text-s
  opacity-l, AI-generation notice text-s opacity-l above a hairline top border.
  Supported by Reader today but no surface currently opens it.

## Interactions

- Bubble expand/collapse inline; Reader for the uninterrupted full text.
- Speaker name links to `/members/:id/votes/`, party logo in summary cards to
  the party page, vote line to `/votes/:id/`; all stopPropagation over the
  row's own tap target.
- Thread search filters turns client-side against the loaded text shards
  (host-owned input); count and pager update live.
- No filters live in this folder; hosts own FilterPill / FilterSheet.

## What the design emphasizes

The debate reads as a conversation: who held the floor (left), who interrupted
(indented right), which party each voice belongs to (bubble tint), and the
chamber's procedural voice reduced to thin system chips, so a citizen follows
the argument, not the protocol.

## Dormant code (as of this audit)

- SpeechEntry renders only the /speeches card; ConversationBubble replaced its
  former turn/nested modes in threads.

## Tokens

| Element | Text size | Weight | Spacing | Component |
|---|---|---|---|---|
| Section captions (host) | s uppercase, ls 0.08em | regular, opacity-l | mb-s | none |
| System chip | s | name semibold, rest regular | my-l py-s, gap-m | hairline rules fg @ opacity-s |
| Bubble, Light | radius-m | none | p-m, thread gap-l, indent xl | approved quiet party surface / `surface` |
| Bubble, Dark | radius-m | none | p-m, thread gap-l, indent xl | `surface` + party opacity-s, stroke-s party opacity-m |
| Bubble speaker name | l | semibold | header gap-s | link |
| Bubble body | l serif (Charter), lh 1.45 | regular | mt-s, clamp 6 | none |
| Expand / collapse | s | semibold, party color | mt-s gap-m | button |
| Reader header name | m | semibold | p-l gap-m | link |
| Reader meta lines | s | regular, opacity-l | mt-xs gap-s | PartyBadge 16 |
| Ballot / stance stamp | Stamp component | semibold | right-aligned | Stamp, rotated=false |
| Reader body | l serif, lh 1.45 | regular | p-l | none |
| Reader footer | s | regular, opacity-l | px-l py-m | chevrons 17 |
| Avatars | initials text-s | semibold | pile overlap -10px | SpeakerAvatar 24/28/32/36 |
| Dialog frame | radius-m desktop, radius 0 mobile sheet | none | border fg @ opacity-s | none |

Colors: party color only as the identity surface tint and border, logo,
expand-button text, and member-highlight ring. Ballot stamps use
success/danger/yellow. Everything else uses the fg opacity ladder over the three
backgrounds. Radius-m on bubbles and the desktop dialog plus circular avatars
are the sanctioned exceptions to radius 0.
