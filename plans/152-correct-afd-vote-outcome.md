# Correct AfD vote outcome

## Goal

Correct the vote result for `pp21-90-17-streichung-der-automatischen-anpassung-der-abgeordnetenentschadigung` and prevent the wording and tally from diverging again.

## Status

Complete locally.

## Contracts

- The AfD motion was rejected.
- Fix source data or ETL normalization, not presentation code.
- Verify the German and English detail pages and public API output.
- Do not commit, push, or deploy without a new explicit request.

## Log

- Main: began tracing the live page, database row, ETL path, and git history.
- Explore: confirmed the official protocol and extracted JSON say rejected, AfD yes, all other factions no.
- Explore: traced the false inversion to forward Drucksache resolution before the session XML arrived. Later title and initiator repair preserved the sticky inverted result.
- Main: found the same defect on the adjacent AfD amendment and added source ordering, transcript-aware polarity classification, a public-data gate, and an idempotent two-row repair.
- Main: backed up SQLite, repaired both rows, regenerated the affected title, description, party explanations, and translations, then verified the repair script converges to zero changes.
- Tester: public-data validation, TypeScript, two source-selection tests, desktop 1440x900, and mobile 390x844 passed. The page renders rejected with AfD 150 in favor and 477 against, without console errors.
- Reviewer: rejected a universal Drucksache ordering rule using session 31 as a counterexample. The durable fix now uses explicit source pins only for the two ambiguous session 90 rows, with pinned and unpinned regression coverage.
- Reviewer: final scoped source-pin implementation is clean.
