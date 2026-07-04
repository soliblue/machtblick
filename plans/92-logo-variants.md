# Machtblick logo variants

## Goal

Generate five preview directions for a refreshed Machtblick logo that stay close to the current product identity: plain text wordmark in the nav, a minimal double-eye mark, one red accent pupil, and simple vector-friendly geometry.

## Status

Preview generation in progress. No production asset has been replaced.

## Shared contracts

- Current static asset: `apps/bundestag/public/logo.svg`
- Current nav rendering: `apps/bundestag/src/views/nav/ScrollEyeWordmark.tsx`
- Current nav CSS: `apps/bundestag/src/styles/globals.css`
- Output for this step is selection material only.
- Final implementation after selection should be SVG or inline SVG, not a raster-only logo.

## Open questions

- Which variant should become the source for the final SVG implementation?

## Log

### lead

- Inspected the public SVG logo, favicon SVG, nav wordmark component, nav CSS, root nav usage, and OG image treatment.
- Confirmed the visible page identity is mostly deterministic HTML text plus a compact inline eye mark, so generated previews should avoid ornate brand typography and stay vector-friendly.
- Generated an initial five-option contact sheet using the current divider as one possible motif.
- User noted the central divider feels weird. Next variants should remove the divider and focus on just the eyes.
- User asked for a more creative round. Next variants can move beyond a literal eye pair while staying civic, sharp, and implementable as SVG.
- Generated a third contact sheet with more distinctive civic observation marks. No checked-in logo, favicon, or nav SVG has been replaced.
- User wants to combine A and E from the creative round: use A's stronger mature silhouette with E's asymmetric gaze and nav-animation fit.
- Generated a focused A plus E hybrid sheet. Production logo, favicon, and nav files are still unchanged.
