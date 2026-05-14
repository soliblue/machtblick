# /datenschutz

## Layout

```
+------------------------------------------------------------+
|  [Nav: Machtblick    Abstimmungen  Abgeordnete  Reden  ..] |
+------------------------------------------------------------+
|                                                            |
|  Datenschutz                                               |
|                                                            |
|                                                            |
|  Diese Seite erhebt keine personenbezogenen Daten. Es      |
|  gibt keine Analyse-Werkzeuge, keine Cookies, kein         |
|  Tracking, keine Konten, keine Formulare. Die im           |
|  Impressum genannten Kontaktadressen werden               |
|  ausschliesslich verwendet, um auf die jeweils gesendete   |
|  Nachricht zu antworten.                                   |
|                                                            |
|                                                            |
|  Stand: 14. Mai 2026                                       |
|                                                            |
+------------------------------------------------------------+
|  [Footer: Impressum  Datenschutz                      ...] |
+------------------------------------------------------------+
```

## Notes

Deliberately short. One paragraph, one date line. No headings inside the body, no section captions -- there is nothing to subdivide. The whole point of the page is that there is nothing to disclose.

Same container width as the Impressum, same readable measure (~65ch) for the paragraph. Generous breathing room above and below the paragraph so the brevity reads as confidence, not as a stub.

This mock assumes **Option A** from the plan -- Fraunces is self-hosted, no `fonts.bunny.net` request, no third-party processing to disclose. If frontend cannot self-host and falls back to Option B, this page gains a second paragraph:

```
+------------------------------------------------------------+
|  Schriftarten                                              |
|                                                            |
|  Diese Seite laedt die Schriftart Fraunces von             |
|  fonts.bunny.net. Dabei wird Ihre IP-Adresse an den        |
|  Bunny-CDN-Server uebertragen ...                          |
+------------------------------------------------------------+
```

That fallback uses the same section-caption style as Impressum (`text-s uppercase opacity-l`). Default mock = Option A.

The "Stand: ..." line is rendered in `opacity-l` so it reads as metadata, not body copy.

## Filters / interactions

- No filters. Static prose.
- One internal link inline: "im Impressum genannten Kontaktadressen" links to `/impressum#kontakt` (or just `/impressum`).

## Emphasis

The reader should see that the page is short and that the message is "we collect nothing" before they finish the first sentence. Brevity is the design statement.

## Tokens

| Element | Text size | Weight | Spacing | Component |
|---|---|---|---|---|
| Page title (h1) | xxl | semibold | mb-xl | -- |
| Body paragraph | m | regular | mb-l, max-w ~65ch | -- |
| Stand date | s | regular | opacity-l, mt-xl | -- |
| (Fallback) section caption | s | regular | uppercase, opacity-l, mb-m, mt-xl | -- |

Components used: none.
