# Vote Pie Center Artifact

## Goal

Remove the visible center artifact in vote result pie charts and keep list charts aligned with the vote detail donut style.

## Status

Done.

## Shared Contracts

- Keep vote views presentational.
- Fix the shared chart renderer if the artifact is shared across pages.
- Preserve existing data contracts and colors.
- Avoid layout redesign unless the renderer requires a small sizing adjustment.

## Open Questions

- Answered: `VoteDistributionDonut` owns the vote result pie charts on the vote list, vote detail, and linked motion result views.
- Answered: member list donuts use a separate Recharts donut with an inner label, so this fix stays scoped to vote result pies.

## Log

### lead

- Created plan after the chart artifact report.
- Found the artifact in `VoteDistributionDonut`; closed sector strokes used default miter joins at the center point.
- Rounded the closed sector stroke joins to avoid miter spikes at the center point.
- Removed the separate radial separator overlay because it made the center read like a smaller nested pie.
- Verified with `npx tsc -p apps/bundestag/tsconfig.json --noEmit` and a Playwright screenshot against the running Vite server on port 5174.
- Made the center hole render without requiring the center label, so vote list charts use the same donut form as vote detail without showing a number.
- Reduced vote list chart size from 88/160px to 80/144px while leaving detail chart sizes unchanged.
- Reopened after pre-deploy smoke found React hydration mismatch on `/votes/` from SVG path floating point strings. Rounded donut path coordinates before serializing the `d` attribute.
