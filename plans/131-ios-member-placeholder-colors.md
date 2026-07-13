# iOS Member Placeholder Colors

## Goal

Replace the pale gradient behind members without photos with a stronger, varied color treatment.

## Status

- Lead: complete
- Commit and push: in progress

## Shared Contracts

- Choose the placeholder color deterministically from member identity so it stays stable across renders and launches.
- Use existing theme accent colors rather than bespoke values.
- Preserve the initials, party mark, name overlay, card geometry, and behavior.
- Change only the missing-image state in the iOS member grid.

## Open Questions

- None.

## Log

- 2026-07-13 user: Requested a nicer varied background instead of the washed-out gradient for members without images.
- 2026-07-13 lead: Chose a stable palette assignment instead of runtime randomness to prevent visible color changes during grid reuse.
- 2026-07-13 lead: Limited the black name-legibility gradient to loaded photos and replaced the missing-image surface with a deterministic solid tint from eight existing accent colors.
- 2026-07-13 lead: Verified the palette assignment distributes 639 current members across all eight colors, keeps Anna Aeikens on one stable purple tint, and preserves readable foreground contrast in light and dark themes.
- 2026-07-13 user: Authorized committing and pushing the completed iOS changes.
