# Anträge vote design parity

## Goal

Align the motion list and detail pages with the established vote list and detail design across desktop and mobile.

## Status

- [x] Capture matching reference and current screenshots
- [x] Record the visual mismatch contract
- [x] Implement list-page parity
- [x] Implement detail-page parity
- [x] Validate build, responsive rendering, console health, filtering, and navigation

## Contract

- Vote pages are the reference
- Preserve motion-specific information architecture
- Reuse existing tokens and components
- Keep views presentational and logic in hooks
- Do not change source data or route paths

## Log

- Browser plugin unavailable, using the repository Playwright setup.
- Before screenshots: `/tmp/machtblick-antraege-before`.
- List mismatch: motions use rounded bordered cards and a conventional stack; votes use an edge-to-edge editorial feed, stronger title and prose hierarchy, responsive full-card composition, and outcome visualization.
- Detail mismatch: motions lack the vote detail's compact header rhythm, action placement, tabbed information architecture, and result-first composition.
- Shared target: retain motion status, timeline, documents, and narrative content while adopting vote typography, spacing, feed behavior, tabs, and result treatment.
- List implementation: replaced boxed cards with full-panel snap feed items, shared straight status stamps, fitted serif summaries, separators, canonical hemicycles and party donuts, shared filters, and stretched links while retaining pagination and motion metadata. Linked vote titles make amendment results explicit.
- List QA: TypeScript passes. Playwright verified desktop, mobile, and compact 320 by 568 rendering, status filtering, mobile filter dialog, navigation, and clean motion-route console output. After screenshots are in `/tmp/machtblick-antraege-after`.
- Detail implementation: matched the vote detail header, typography, tabs, and surfaces; linked votes now lead with the hero hemicycle and party donuts, while procedure, subjects, long-form content, sources, and speeches remain available in URL-backed tabs.
- Detail QA: TypeScript passes. Playwright verified desktop and mobile layouts, Details and Reden navigation, direct PDF access, and clean console output. After screenshots are in `/tmp/machtblick-antraege-after`.
- Data semantics: motion status stays authoritative, linked vote results are explicitly labeled, linked vote ordering is deterministic, and one shared count derivation keeps list and detail hemicycles identical.
- Production QA: targeted client and SSR builds prerendered both motion indexes plus representative German and English details, including no-vote, named-vote, handzeichen, concluded-law, and bill cases.
- Full repository build passed unit checks and client/server compilation, then the foreground runner was terminated during the unrelated repository-wide member prerender.
