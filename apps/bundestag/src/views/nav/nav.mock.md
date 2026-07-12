# Shared navigation

Route: every website route

Theme and language use one compact segmented-control grammar. The desktop theme
control is reduced to Sun and Moon icon cells, while language remains textual.
The selected segment uses an inverse fill, so its state remains obvious in Light
and Dark without relying on icon interpretation or a subtle gray change.

The desktop row begins at the existing `desk` breakpoint of 700px. The two icon
cells sit immediately before the language picker. Below that, the menu gives
each preference its own labeled row and keeps every tap target full size. The
compact icon cells leave room for the standard `l` navigation and `m`
control-group gaps across the full desktop range.

## Desktop, fresh visit

```text
+------------------------------------------------------------------------------------------+
| Machtblick       Abstimmungen  Abgeordnete  Fraktionen   [▓ Sun ▓|Moon] [▓ DE ▓|EN]   |
+------------------------------------------------------------------------------------------+
                                                            appearance    language
```

Stippled cells in the mock mean `fg` fill with `background` text. The stipple is
not rendered. Fresh or missing preference state selects Light even when the
browser or operating system prefers Dark.

`Sun` and `Moon` stand for Lucide icons, not rendered words. Each icon has a
localized accessible name and matching hover or focus Tooltip: German `Hell`
and `Dunkel`, English `Light` and `Dark`. Desktop language cells remain the
textual `DE` and `EN`, without flags.

## Mobile menu, explicit Dark and English selected

```text
+---------------------------------------------+
| Machtblick                               X  |
|                                             |
| Abstimmungen                                |
| Abgeordnete                                 |
| Fraktionen                                  |
|                                             |
| DARSTELLUNG                                 |
| [ Sun  Hell     |▓ Moon  Dunkel ▓]          |
|                                             |
| SPRACHE                                     |
| [ Deutsch       |▓ English ▓]               |
+---------------------------------------------+
```

`Sun` and `Moon` stand for the same Lucide icons as desktop. The preference
groups stack instead of competing for one narrow row. Mobile pairs each theme
icon with its localized visible label, uses full language names, and keeps a
minimum 44px target height. The controls never wrap individual choices.

The mobile sticky shell and its top bar keep the existing collapsed 54px geometry
whether the menu is open or closed. The expanded menu is an opaque `background`
panel anchored immediately below that bar and positioned outside document flow.
It overlays the page instead of making the sticky element taller.

```text
+---------------------------------------------+  sticky shell, always 54px
| Machtblick                               X  |
+=============================================+  anchored overlay starts here
| Abstimmungen                                |
| Abgeordnete                                 |
| Fraktionen                                  |
|                                             |
| DARSTELLUNG                                 |
| [ Sun  Hell     | Moon  Dunkel ]            |
|                                             |
| SPRACHE                                     |
| [ Deutsch       | English ]                 |
+---------------------------------------------+
       page remains in place underneath
```

## Filters / interactions

- Theme is a two-choice radiogroup. Exactly one of Light and Dark is selected.
  Fresh, missing, legacy System, and unknown preference states resolve to Light.
- Selecting any appearance updates the page immediately and persists across
  reloads. Browser or operating-system appearance does not change the website.
- Language is a two-choice group of locale-aware links. The current URL locale
  selects exactly one segment.
- A selected segment uses `fg` fill, `background` text, and semibold weight.
  Unselected segments use transparent fill and full readable foreground text.
  Hover uses `surface`; it must not look identical to the selected state.
- The desktop theme icons expose localized accessible names and Tooltips. The
  appearance group label remains screen-reader-only. Mobile shows the localized
  captions `Darstellung` and `Sprache`, or `Appearance` and `Language`.
- Right or Down Arrow moves focus and selection to the next theme, while Left or
  Up Arrow moves to the previous theme, wrapping at either end. Space selects
  the focused option. Exactly one option is in the Tab sequence. Tab moves
  between theme, language, and surrounding navigation. Every cell has a visible
  focus outline.
- Theme inputs expose `aria-checked`; language links expose `aria-current`.
  Selection is conveyed by inverse contrast and accessibility state, not icons
  alone.
- Opening and closing the mobile menu never changes the sticky shell height,
  document flow, current scroll position, or page snap position. The anchored
  panel has no height or translate transition. Its content may scroll within a
  maximum height of the viewport minus the 54px bar.
- The wordmark and Menu or X control remain continuously visible while the panel
  mounts and unmounts. Closing cannot expose the page above the bar for an
  intermediate frame, including in mobile Safari.
- Dark appearance remaps the shared `background`, `surface`, `elevated`, and
  `fg` tokens. Layout, party meaning, and status meaning do not change.

## What This Emphasizes

The current appearance and language are readable at a glance while the desktop
controls stay compact and every fresh visit begins in Light.

## Tokens

| Element | Size / weight | Spacing | Component |
|---|---|---|---|
| Navigation links | m regular | gap-l | links |
| Desktop preference groups | s regular | gap-m between groups | segmented radiogroup / links |
| Desktop theme cell | 32px square | centered | Button anatomy, Tooltip |
| Desktop theme icons | icon-s, 14px | centered | Sun, Moon |
| Desktop language segment | 32px high, active semibold | px-s | Button anatomy |
| Mobile preference caption | s uppercase regular, opacity-l | mb-s | legend / group label |
| Mobile segment | m regular, active semibold, min 44px high | px-m | Button anatomy |
| Mobile theme icons | icon-m, 17px | gap-s before label | Sun, Moon |
| Mobile preference stack | none | gap-l between groups | none |
| Mobile sticky bar | existing 54px collapsed geometry | px-l | sticky shell |
| Mobile menu panel | opaque `background`, max viewport minus bar | p-l, gap-l | anchored overlay |
| Mobile panel edge | stroke-s, `fg` at opacity-s | none | none |
| Group border | stroke-s, `fg` at opacity-s | radius-m | none |
| Active segment | `background` text | `fg` fill | none |
| Hover segment | full foreground | `surface` fill | none |
