# 105 Twenty Rounds

## Goal
20 iterative improvement rounds across the whole bundestag app, then one push + prod deploy after round 20. Each round focuses on ONE category and ends with a commit. User checks dev.machtblick.de between rounds but tests properly only after round 20. Categories: design (rehaul rest of app using the card language from plan 102), bugs, codebase cleanup, SEO.

## Round schedule
Cycle pattern design/bugs/cleanup/seo, with design weighted (views still on the old idiom: members list, member detail, parties list, party detail, vote detail, speeches, motion detail).

| # | Category | Focus | Status |
|---|----------|-------|--------|
| 1 | design | Design-rules reassessment: update CLAUDE.md Design section from what plan 102 taught (radius 0, chip idiom, banner, poster numerals, card boundary system, serif usage) | done |
| 2 | design | Vote detail rehaul (user request, pulled forward from 17): hemicycle replaces the single donut, per-party donut row replaces the waffle squares, redesigned Abweichler list, improved speeches-tab summary section | implemented |
| 3 | cleanup | Dead code, house-style violations, stray comments, single-use helpers, oversized files | todo |
| 4 | seo | Plan 103 follow-ups: per-page OG images, en motion titles (ETL), llms.txt refresh | todo |
| 5 | design | Members list rehaul to card language | todo |
| 6 | bugs | Tester sweep of members + parties flows, fix | todo |
| 7 | cleanup | hooks/ and lib/ consolidation, type tightening | todo |
| 8 | seo | Structured data depth (Person/PoliticalParty enrichment), internal linking | todo |
| 9 | design | Member detail rehaul | todo |
| 10 | bugs | Tester sweep member detail + votes detail, fix | todo |
| 11 | cleanup | views/ dead styles, token discipline audit (find non-token values, fix) | todo |
| 12 | seo | Meta description quality pass (German copy), sitemap freshness | todo |
| 13 | design | Parties list + party detail rehaul | todo |
| 14 | bugs | Tester sweep speeches + motions, fix | todo |
| 15 | cleanup | ETL/db scripts hygiene, prompts/auto-refresh.md coherence | todo |
| 16 | seo | OG image polish, social preview verification all page types | todo |
| 17 | bugs | Full tester sweep all routes both viewports/locales, fix everything found (displaced from 2) | todo |
| 18 | design | Speeches + motion detail rehaul | todo |
| 19 | bugs | Full regression sweep, fix | todo |
| 20 | cleanup+seo | Final polish: typecheck, unused deps, visibility pre-deploy audit | todo |

After round 20: push all commits, deploy to prod (user gave explicit standing approval for this one deploy), then user tests.

## Rules per round
- One category per round, commit at the end (scribe), no push until after round 20.
- Design rounds: designer mock first, frontend implements, screenshot verification. Card language from votesList.mock.md is the reference idiom.
- Bug rounds: tester finds, frontend/plumber fixes, tester re-verifies fixes.
- Standing user constraints: no left rails, no AI-tell patterns, radius 0 on cards, mobile-first, filter pills/sheet idiom, Sonstige stays for initiator-less votes.
- Dev server :5174 stays up; hot reload; do not restart.

## Log
- lead: plan created, starting round 1
- designer (round 1): CLAUDE.md Design section rewritten from the settled plan-102 card language (verified against live VoteCard/VoteHemicycle/PartyDonutRow/FilterSheet, not just the mock): radius token is now 0-everywhere with the floating-control exception, new font-roles row (Fraunces display, Charter summary prose, sans chrome) + poster-numeral exception (32px+ font-display tabular-nums), new card-language block (white card + hairline + double shadow, verdict chip straddling the 3px colored top edge, straight text, hemicycle canonical + party donut row with yellow abstain / faint absent, serif markdown summaries, stretched link, one component reflowed per breakpoint, floating filter pill + bottom sheet, no feed mastheads), proposer = logo only, and an explicit ban list (rails, rotated stamps on lists, gray cards, mastheads, third weight, bespoke grays). .claude/agents/designer.md house conventions rewritten to match (card language is the reference look; stacked bars demoted to metric-breakdown idiom; stat pies + page header scoped to detail pages; em dashes removed). NOTE for a later round: votesList.mock.md itself still describes the pre-chip Stamp overlay, 380px right column, and daylines; live code has chip-on-top-edge, 280px column, flat feed. Not touched this round (rules were the deliverable), worth a mock refresh in round 5 or 17.
- designer (round 2): voteDetail.mock.md rewritten for the card language (screenshotted current Ergebnis+Reden at 390/1440 on vote 2025-12-05-985 first). Four decisions: (1) hemicycle replaces the 240px donut as the hero, poster numerals 40px flanking, and the choice filter moves INTO the legend (JA/NEIN numeral blocks + ENTHALTUNG/ABWESEND lines are aria-pressed toggles; VoteCountsRow deleted, dots dim to opacity-s, filter still flows to the party donuts via existing `selected` prop). (2) PartyWaffle (630 squares) replaced by VoteDistributionDonut size 72 per Fraktion, sorted Ja-share to Nein-share (reuse PartyDonutRow/lineParties sorting), two-line colored tabular tally under each, Tooltip full tally, donut links to party page; per-member drill-down deliberately moves to Abweichungen. (3) Abweichler grouped per party: header = PartyLogo 20 + "Linie JA" chip + "9 von 197" + hairline, member rows lose the 9x repeated trailing party logo, choice chip right-aligned, desktop 2-col grid. (4) Reden summaries: gray notice box becomes a plain text-s line, each row = logo 20 + derived stance chip (DAFUER/DAGEGEN/ENTHALTEN/GESPALTEN, from partySummaries counts, needs i18n keys) + Charter serif line-clamp-3 prose, modal unchanged. Source-data box moves to a bottom footnote. Deletions for frontend: PartyWaffle.tsx, VoteCountsRow.tsx.
- frontend (round 2): implemented per voteDetail.mock.md. VoteHemicycle.tsx extended with hero/selected/onSelect props (40px numerals, max-w 440, aria-pressed legend toggle buttons, dots dim to 0.15; list rendering unchanged via defaults). New voteDetail/PartyDonutGrid.tsx (72px VoteDistributionDonut per Fraktion, sorted via new deriveDek.partiesByJaShare which PartyDonutRow now also uses, colored two-line tally, Tooltip full tally, donut links to /parties/:slug/votes/). ResultTab.tsx rewritten (hero hemicycle, donut grid, source box moved to bottom footnote via new i18n officialSource key). DefectorList.tsx grouped per party (PartyLogo 20 + Linie chip + N von M + hairline, desk:grid-cols-2), DefectorRow.tsx lost trailing party logo, chip right-aligned. PartySummaryPreviewList.tsx reworked (plain text-s intro line, logo 20 + stance chip DAFÜR/DAGEGEN/ENTHALTEN/GESPALTEN via new i18n stanceLabels + Charter serif line-clamp-3 MarkdownInline prose; SERIF now exported from VoteCard); DebateList.tsx passes counts through SummaryRow type. antragDetail/AntragVoteResult.tsx swapped PartyWaffle for PartyDonutGrid. Deleted PartyWaffle.tsx + VoteCountsRow.tsx. i18n: abstainShort/absentShort/officialSource/stanceLabels both locales. Typecheck clean; Playwright on :5174 vote 2025-12-05-985 at 390x844 + 1440x900 both locales all tabs: 630 dots, 4 legend toggles dim 312 non-Ja dots + 9 donut segments and clear on second tap, stance chips render both locales, modal opens, /votes/ list unchanged (114 cards/hemicycles), motion 332650 renders donut grid, zero console errors. Screenshots /tmp/round2/.
