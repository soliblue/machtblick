# Shared navigation

Route: every website route

The existing language control already establishes the compact segmented-control
grammar. Theme selection uses the same height and border treatment immediately
before it, with no visible label added to the header.

The desktop row begins at the existing `desk` breakpoint of 700px. Below that,
the menu keeps both fixed-width preference controls intact.

## Desktop, system selected

```text
+---------------------------------------------------------------------------------------+
| Machtblick       Abstimmungen  Abgeordnete  Fraktionen   [(monitor)|sun|moon] [DE|EN] |
+---------------------------------------------------------------------------------------+
                                                            theme       language
```

The three visible theme choices are Lucide icons: Monitor for System, Sun for
Light, and Moon for Dark. Parentheses in the mock indicate the selected cell's
`surface` fill. The language control keeps the existing flag presentation.

## Mobile menu, system selected

```text
+---------------------------------------------+
| Machtblick                               X  |
|                                             |
| Abstimmungen                                |
| Abgeordnete                                 |
| Fraktionen                                  |
|                                             |
| [(monitor)|sun|moon]   [DE|EN]              |
+---------------------------------------------+
    theme                language
```

Both controls share the last menu row. Theme remains immediately before language,
so opening the menu exposes navigation and both preferences without another level.

## Filters / interactions

- Theme is a three-choice radiogroup. Exactly one of System, Light, and Dark is
  selected, with localized accessible names and hover or focus titles.
- German labels are `System`, `Hell`, and `Dunkel`. English labels are `System`,
  `Light`, and `Dark`.
- Selecting Light or Dark updates the whole page immediately and persists across
  reloads. Selecting System clears the explicit choice and follows live browser or
  operating-system preference changes.
- The selected cell uses `surface` and full foreground opacity. Unselected cells
  use foreground `opacity-l`, returning to full opacity on hover or focus.
- Arrow keys move within the radiogroup. Tab moves between theme, language, and
  the surrounding navigation controls. Every cell has a visible focus outline.
- Dark appearance remaps the shared `background`, `surface`, `elevated`, and `fg`
  tokens. Layout, spacing, party meaning, and status meaning do not change.

## What This Emphasizes

The appearance choice stays one glance and one action away without competing with
the primary navigation or widening the mobile menu.

## Tokens

| Element | Size / weight | Spacing | Component |
|---|---|---|---|
| Navigation links | m regular | gap-l | links |
| Theme group | 32px high | before language, gap-m between groups | segmented radiogroup |
| Theme cell | 32px wide | no internal gap | Button anatomy |
| Theme icons | icon-s, 14px | centered | Monitor, Sun, Moon |
| Language group | existing 32px high | unchanged | segmented links |
| Group border | stroke-s, `fg` at opacity-s | radius-m | none |
| Active cell | full foreground opacity | `surface` fill | none |
