# 150 Berlin feed fidelity

## Goal

Replace the oversized election form and overloaded candidate rows with a compact Berlin feed that faithfully follows Machtblick list and detail screenshots.

## Status

- screenshot mismatch ledger: complete
- compact filter model: complete
- candidate row redesign: complete
- mobile density pass: complete
- side-by-side visual QA: complete
- candidate detail source notice: complete
- candidate detail back control removal: complete
- public tunnel verification: complete

## Product contract

- The first viewport contains candidates, not a setup screen.
- Bezirk and Wahlkreis stay reachable from the compact filter rail.
- Every row answers what the person personally names before any click.
- Party programme context never overwhelms the person.
- Candidate rows use open feed surfaces and separators.
- Mobile shows meaningful parts of at least two candidates per viewport.
- Missing personal information remains explicit.
- URL-backed filters and exact Wahlkreis semantics remain intact.

## Log

- 2026-07-25 lead: Reopened the design after the operator correctly rejected the first redesign. The screenshot reference is now a fidelity constraint, not loose inspiration.
- 2026-07-25 audit: Candidate content begins roughly 700 to 950 pixels later than the reference. The hero, duplicate navigation, district matrix, topic rail, metric tiles and repeated programme panels are the primary causes.
- 2026-07-25 frontend: The feed now opens on candidates. Desktop uses the shared search and filter rail, mobile uses a floating filter sheet, and rows contain only identity, personal priorities and open ballot facts.
- 2026-07-25 lead: Move occupation exclusively into the candidate identity block and add a one-click original-source notice at the top of every candidate detail.
- 2026-07-25 tester: Verified the Anna Eiling flow on desktop and mobile at berlin.machtblick.de. The occupation appears only in the identity block, the profile source opens in one click, and both viewports have no overflow or console errors.
- 2026-07-26 lead: Remove the candidate-detail back control to match Machtblick detail navigation.
- 2026-07-26 tester: Verified zero back controls on desktop and mobile, immediate identity placement below navigation, working party navigation, no overflow, and no console errors.
