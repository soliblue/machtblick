# mp members list (EU German lens)

Reuses the bundestag members grid (photo/initials card, Anwesenheit + Fraktionslinie
bars). Only addition vs `/members/`: filter chips above the grid, driven by data
(country and national_party only exist for EU; Landtage show just the Fraktion row).

```
| EU-Parlament                                    |  <- MpSectionNav
| Abstimmungen  [Abgeordnete]  Fraktionen         |
|                                                 |
| LAND                                            |  <- only when members have country
| [ Alle Länder ] [ Deutschland ]                 |     chip: selected = surface bg + semibold
|                                                 |
| PARTEI                                          |  <- only when Deutschland active
| [ Alle ] [ CDU/CSU ] [ SPD ] [ AfD ] [ Grüne ] |     national_party chips (German lens)
|                                                 |
| FRAKTION                                        |  <- always
| [ Alle ] [ EVP ] [ S&D ] [ Renew ] [ … ]        |     EU group slugs
|                                                 |
| 96 Abgeordnete                                  |
| [photo] [photo] [photo] [photo] [photo]         |  <- grid 2/3/4/5 cols; card = MpMemberCard
| name    name    name    name    name            |     label · nationalParty, Anwesenheit bar
```

- Filters are client `useState` (presentational interaction, no fetch).
- Deutschland = `country === 'DEU'`; then national_party sub-filter (the German-lens
  cut on a body where the vote breakdowns stay by EU group).
- Landtage (be/by): country/national_party null → only the Fraktion row renders;
  member sub-line falls back to state or the group label; pictureUrl null → initials.
```
