# 105 Twenty Rounds

## Goal
20 iterative improvement rounds across the whole bundestag app, then one push + prod deploy after round 20. Each round focuses on ONE category and ends with a commit. User checks dev.machtblick.de between rounds but tests properly only after round 20. Categories: design (rehaul rest of app using the card language from plan 102), bugs, codebase cleanup, SEO.

## Round schedule
Cycle pattern design/bugs/cleanup/seo, with design weighted (views still on the old idiom: members list, member detail, parties list, party detail, vote detail, speeches, motion detail).

| # | Category | Focus | Status |
|---|----------|-------|--------|
| 1 | design | Design-rules reassessment: update CLAUDE.md Design section from what plan 102 taught (radius 0, chip idiom, banner, poster numerals, card boundary system, serif usage) | done |
| 2 | bugs | Full tester sweep all routes both viewports/locales, fix everything found | todo |
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
| 17 | design | Vote detail rehaul | todo |
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
