# iOS Member Placeholder Colors

## Goal

Replace the pale gradient behind members without photos with a stronger, varied color treatment.

## Status

- Lead: regression fix complete, pushed CI pending
- Commit and push: in progress

## Shared Contracts

- Choose the placeholder color deterministically from member identity so it stays stable across renders and launches.
- Use existing theme accent colors rather than bespoke values.
- Preserve the initials, party mark, name overlay, card geometry, and behavior.
- Keep every member name aligned to the card bounds for both loaded photos and placeholders.
- Change only the missing-image state in the iOS member grid.

## Open Questions

- None.

## Log

- 2026-07-13 user: Requested a nicer varied background instead of the washed-out gradient for members without images.
- 2026-07-13 lead: Chose a stable palette assignment instead of runtime randomness to prevent visible color changes during grid reuse.
- 2026-07-13 lead: Limited the black name-legibility gradient to loaded photos and replaced the missing-image surface with a deterministic solid tint from eight existing accent colors.
- 2026-07-13 lead: Verified the palette assignment distributes 639 current members across all eight colors, keeps Anna Aeikens on one stable purple tint, and preserves readable foreground contrast in light and dark themes.
- 2026-07-13 user: Authorized committing and pushing the completed iOS changes.
- 2026-07-13 user: Reported that names on loaded photos were clipped after the placeholder-color change, while the new solid placeholder rendered correctly.
- 2026-07-13 lead: Constrained and clipped loaded photos to the card bounds before applying the gradient and name overlay, restoring leading alignment without changing the placeholder treatment.
