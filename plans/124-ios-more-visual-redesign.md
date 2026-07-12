# 124 iOS More Visual Redesign

## Goal

Redesign the native iOS More experience so it is visual, compact, calm, informative, creative, and consistent with the app and website. Restore the preferred icon-only root navigation. Explore several high-fidelity visual directions before selecting one and planning implementation.

## Status

- Current native visual-language audit: done
- Current More information-architecture audit: done
- Image-generated visual directions: in progress
- User direction selection: pending
- Implementation plan: pending
- Implementation: explicitly deferred until a direction is selected

## Product contracts

- Root navigation returns to icons without visible text labels.
- More uses a better-fitting root icon than `ellipsis.circle`.
- Language is the first row and uses a compact picker that fits the selected visual direction.
- Remove the slogan and oversized header treatment.
- Keep one compact row per primary item.
- Prefer native in-app pages containing the localized methodology, imprint, privacy, and related website content instead of repeatedly opening the website.
- The Machtblick logo may sit quietly at the top without explanatory copy.
- Visual hierarchy comes from spacing, typography, shape, and useful illustration or symbols, not link volume or decorative color.
- German and English remain equally supported.

## Concept round

Generate three deliberately different high-fidelity iPhone directions using the current app palette, typography character, spacing rhythm, and icon language. Each direction must show the full More screen and icon-only tab bar at a compact phone width.

1. Editorial index: quiet logo, strong type, thin separators, compact language control, and one elegant row per destination.
2. Soft cards: small grouped surfaces, restrained symbols, native content destinations, and a more tactile language selector.
3. Visual poster: a compact graphic identity moment followed by an unusually concise utility index, without a slogan or oversized hero.

## Selection questions

- Which overall direction should become the source of truth?
- Which language control feels best?
- Which More icon fits the app best?
- Which rows belong on the root screen, and which belong inside an About page?

## Log

- 2026-07-12 user: asked to restore icon-only root navigation and redesign More around a visual, compact, pretty, informative, creative system consistent with Machtblick. Requested native localized content pages instead of repeated website links, language first, no slogan, one row per item, a better More icon, and several image-generated iterations before implementation.
- 2026-07-12 lead: started a visual-direction-only round using the image-generation skill. Implementation remains deferred until the user selects and refines a concept.
- 2026-07-12 designer: identified the app's load-bearing visual language as a white editorial canvas, Fraunces display type, Lora prose, system utility labels, thin black rules, fixed token spacing, semantic color, and bespoke civic-data motifs. Recommended replacing the generic inset Settings list with a compact editorial surface.
- 2026-07-12 ios: confirmed icon-only tabs are a proven low-risk local pattern with localized accessibility labels. Recommended a trailing menu picker for Language, native About the data, Privacy, and Imprint pages, one Contact and feedback destination, direct sharing, and a quiet freshness and version footer. `info.circle`, `circle.grid.2x2`, and a future monochrome eyes asset are the three candidate More symbols.
