# 43 Reading Pairs And Related Debates

## Goal

Make formal second and third reading vote pairs understandable, and show relevant earlier speeches when a final vote has no same-day debate block but shares a Drucksache with an earlier debate.

## Scope

- Preserve or add visible reading-stage labels for hand-vote titles that otherwise look duplicated.
- Carry missing Drucksache, initiator, summary, and document metadata from adjacent reading-pair votes when the source protocol omits it.
- Load related earlier debate speeches for vote detail and Antrag detail when the direct vote debate is empty.
- Keep exact same-day debate matching as the first choice.
- Rebuild and verify the affected pages.

## Contracts

- Do not pretend an earlier debate happened on the vote date.
- Only attach related earlier speeches through shared Drucksache numbers and term 21 protocol agenda items.
- Keep the data fix reproducible through a script or ETL path.

## Status

- Completed.

## Log

### lead

- Started follow-up from the data mapping audit after finding a misleading second and third reading pair on 2026-05-08.
- Added an idempotent normalization script for reading-pair metadata and related earlier recorded-vote speeches.
- Normalized the 2026-05-08 foot-fessel second and third reading pair so both rows share Drucksache, initiator, Antrag link, summary metadata, and distinct reading labels.
- Linked two recorded votes without same-day debate blocks to earlier Drucksache-matched speeches: 2025-06-26 railway land use to 15 speeches from 2025-06-05, and 2025-11-13 transmission-grid costs to 17 speeches from 2025-10-10.
- Kept related speech linking restricted to recorded votes after validating broader hand-vote matches were too broad for this change.
- Updated vote and Antrag detail debate rendering to label related earlier speeches and show speech dates.
- Verified the normalization rerun is clean, app typecheck, data-script typecheck, and full Bundestag build.
- Reopened for reading-pair ordering, missing agenda metadata, copied sibling summary text, and false `Sonstige` initiators.
- Fixed petition and Wahlprüfung hand-vote initiators, copied missing agenda and sibling summary metadata for reading pairs, and sorted same-day hand votes by protocol order so third readings appear after second readings in chronology.
