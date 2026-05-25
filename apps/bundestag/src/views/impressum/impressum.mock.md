# /imprint

## Layout

```
+------------------------------------------------------------+
|  [Nav: Machtblick    Abstimmungen  Abgeordnete  Reden  ..] |
+------------------------------------------------------------+
|                                                            |
|  Impressum                                                 |
|                                                            |
|                                                            |
|  WAS IST MACHTBLICK                                        |
|                                                            |
|  Machtblick ist das Projekt eines einzelnen deutschen      |
|  Burgers, der mit Hilfe von KI Werkzeuge baut, die die     |
|  Arbeit des Bundestages und der Regierung zugaenglicher    |
|  machen. Keine Kommentare, keine politische Position,      |
|  kein Aktivismus. Es geht darum, oeffentliche Quellen in   |
|  eine Oberflaeche zu uebersetzen, die fuer den             |
|  durchschnittlichen Burger nutzbar ist.                    |
|                                                            |
|                                                            |
|  DATENQUELLEN                                              |
|                                                            |
|  Deutscher Bundestag                                       |
|    Stammdaten - bundestag.de                              |
|    Stammdaten der Abgeordneten                             |
|                                                            |
|    Plenarprotokolle - dserver.bundestag.de                |
|    Reden und Protokolle der Plenarsitzungen                |
|                                                            |
|    Parlamentaria - bundestag.de                           |
|    Parteispenden ueber 50.000 Euro                         |
|                                                            |
|    DIP - Parlamentsinformationssystem                     |
|    search.dip.bundestag.de                                 |
|    Antraege und Drucksachen                                |
|                                                            |
|  Quellen ohne explizite Lizenzangabe sind oeffentlich      |
|  zugaengliche Daten des Deutschen Bundestages.             |
|                                                            |
|                                                            |
|  abgeordnetenwatch                                         |
|    abgeordnetenwatch.de                                    |
|    Profile, Fraktionswechsel, Portraitverweise             |
|                                                            |
|                                                            |
|  Bilder                                                    |
|    Wikidata - query.wikidata.org                          |
|    Portraitverweise (P18) - CC0                           |
|                                                            |
|    Wikimedia Commons - commons.wikimedia.org              |
|    Portraitdateien - Lizenzen je Datei, mitgespeichert    |
|                                                            |
|                                                            |
|  GRUNDSAETZE                                               |
|                                                            |
|  Keine Kommentare, keine Voreingenommenheit gegenueber     |
|  irgendeiner Gruppe, kein Aktivismus. Nur ein leichterer   |
|  Zugang zu Informationen aus Quellen, die von grossartigen |
|  Menschen oeffentlich gemacht wurden.                      |
|                                                            |
|                                                            |
|  KONTAKT                                                   |
|                                                            |
|  Fragen       hello@machtblick.de                          |
|  Feedback     feedback@machtblick.de                       |
|  Mitmachen    mitmachen@machtblick.de                      |
|                                                            |
|                                                            |
|  ZUR PERSON                                                |
|                                                            |
|  Aus Datenschutzgruenden werden Name und Anschrift des     |
|  Betreibers hier nicht veroeffentlicht. Sollte das Projekt |
|  groessere Verbreitung finden, wird dies angepasst.        |
|                                                            |
+------------------------------------------------------------+
|  [Footer: Impressum  Datenschutz                      ...] |
+------------------------------------------------------------+
```

## Notes

Single column, prose page. Same `max-w-3xl` container as the rest of the app, but body content sits inside a narrower readable measure (~65ch) so paragraphs don't run wide. No card chrome around sections; whitespace alone separates them.

Section captions follow the house convention: `text-s uppercase opacity-l` with `letter-spacing: 0.08em`. They are not links and they are not headings the user is meant to scan as a TOC - they are quiet labels above each block.

Datenquellen is the only structurally interesting section. The 8 sources collapse into three groups so the page doesn't read as a flat dump of 8 bullets:

- **Deutscher Bundestag** - 4 entries (Stammdaten, Plenarprotokolle, Parlamentaria, DIP). Group heading in regular weight, entries below indented by one spacing step. Each entry is a two-line block: source name + URL, then a single line describing what we use from it.
- **abgeordnetenwatch** - standalone, same structure.
- **Bilder** - 2 entries (Wikidata, Wikimedia Commons), grouped because they share the image-attribution semantics.

The license-disclaimer line sits inside the Bundestag group, in `opacity-m` so it reads as a footnote, not a section.

Kontakt is rendered as a 2-column key/value pairing (label left, email right) rather than three bullet lines; mailto-clickable.

No backlink at the top, no breadcrumbs - this page is reached from the footer and is its own destination.

## Filters / interactions

- No filters. Static prose.
- All URLs and email addresses are links.
- Email addresses use `mailto:` and inherit accent on hover.
- External links open in a new tab; underlined on hover only.

## Emphasis

A reader should grasp at a glance that this is a one-person project built on public data, see the list of upstream sources without scrolling far, and find the three contact addresses without searching.

## Tokens

| Element | Text size | Weight | Spacing | Component |
|---|---|---|---|---|
| Page title (h1) | xxl | semibold | mb-xl | - |
| Section caption | s | regular | uppercase, opacity-l, letter-spacing 0.08em, mb-m, mt-xl | - |
| Body paragraph | m | regular | mb-m, max-w ~65ch | - |
| Source group heading | m | semibold | mb-s, mt-l | - |
| Source name | m | regular | - | - |
| Source URL | m | regular | opacity-l | - (link) |
| Source description | s | regular | opacity-l, mb-m | - |
| License footnote | s | regular | opacity-m, mt-s | - |
| Kontakt row label | m | regular | opacity-l, w fixed | - |
| Kontakt row value | m | regular | - | - (mailto link) |

Spacing scale: section-to-section uses `mt-xl` (24). Within a section, paragraph rhythm is `mb-m` (12). Group entries inside Datenquellen use `mb-m` between entries and `mt-l` between groups.

Components used: none - this is plain prose. No Card, no Badge, no Tabs.
