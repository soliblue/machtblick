# iOS Member Name Layout

## Goal

Restore member names to the visible card bounds after the latest photo and placeholder changes.

## Status

- Pull latest main: completed
- Reproduce the members-page regression: completed
- Fix the member-card label layout: completed
- Verify the members page in Simulator: completed
- Commit, push, and trigger TestFlight: in progress

## Contracts

- Keep the deterministic placeholder colors introduced in plan 131.
- Keep loaded photos cropped to the member card.
- Keep every member name leading-aligned inside the visible card bounds.
- Change only the iOS member-card layout required for this regression.

## Open Questions

- None.

## Log

- 2026-07-13 user: Reported malformed member names after the two latest iOS member-card commits and requested a focused local fix, verification, push, and TestFlight build.
- 2026-07-13 lead: Pulled and rebased onto `cdb9c47`, then traced the regression to labels attached to scaled photo content rather than a card-sized container.
- 2026-07-13 lead: Wrapped loaded photos in a card-sized clear container, preserving the existing crop, gradient, placeholder palette, and name styling while restoring leading alignment.
- 2026-07-13 lead: Built and installed the fixed Debug app on the iOS 26.5 simulator and visually verified complete names for Sanae Abdi, Knut Abraham, Doris Achelwilm, Anna Aeikens, Adis Ahmetović, and Gökay Akbulut.
