# 124 iOS More Visual Redesign

## Goal

Redesign the native iOS More experience so it is visual, compact, calm, informative, creative, and consistent with the app and website. Restore the preferred icon-only root navigation, ship native localized footer content, and deliver the selected result through TestFlight.

## Status

- Current native visual-language audit: done
- Current More information-architecture audit: done
- Image-generated visual directions: done
- User direction selection: done
- Selected ASCII source of truth: done
- Implementation: done
- Native content parity and bilingual verification: done
- iOS build, smoke, commit, push, and TestFlight delivery: pending

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

## Selected direction

- Use the same compact `BrandWordmark` toolbar header as Votes, Members, and Parties. Do not create a separate More hero or title treatment.
- Keep the root page flat and white with token spacing and light hairline dividers.
- Make Language the first compact row. Use a trailing native menu picker showing the selected value, with System, Deutsch, and English inside the menu.
- Mirror the website footer with exactly three primary native destinations: About the data, Imprint, and Privacy.
- Give every root row one restrained, semantically matching SF Symbol. Use `globe`, `building.columns`, `doc.text`, and `hand.raised`.
- Replace the More tab's `ellipsis.circle` with `slider.horizontal.3` and restore icon-only labels for all four root tabs while retaining localized accessibility labels.
- Put data freshness and the native Share Machtblick action at the bottom. Keep version and build as quiet metadata.
- Do not retain root rows for Website, Questions, Feedback, or Contribute. Website and the three contact addresses live naturally inside the native About and Imprint content.
- Tapping About the data, Imprint, or Privacy pushes a native localized reading page. Its content must match the corresponding website content exactly, including headings, paragraphs, source links, and contact links.
- The website remains the copy source of truth. Add a checked parity contract so future website copy changes cannot silently leave the app behind.

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
- 2026-07-12 user: rejected the three generated compositions and selected a simpler synthesis. Requested the same header as every other tab, an inline Language picker, light dividers, SF Symbols, native About the data, Imprint, and Privacy pages matching the website exactly, bottom data freshness and sharing, icon-only root navigation, commit, push, and deployment to the user's phone through iOS.
- 2026-07-12 lead: selected a flat native information index using the shared toolbar wordmark, a menu picker, the three website-footer destinations, `slider.horizontal.3` as the root symbol, and native content parity checks. Began implementation with SwiftUI UI-pattern and iOS debugger workflows.
- 2026-07-12 designer: replaced the concept-round mock with the selected bilingual ASCII source of truth for the compact root, language menu, and native reading-page hierarchy.
- 2026-07-12 ios: implemented the flat More root, icon-only tabs, native bilingual About the data, Imprint, and Privacy pages, in-app external links, native mail links, and localized back affordances.
- 2026-07-12 tester: added ordered website-content parity, static More UI, localization, and release workflow gates. Local checks pass for 171 bilingual catalog keys, 232 ordered native content fields, the selected UI contract, JSON, JavaScript, YAML, Python, and diff hygiene. Swift compilation and simulator smoke remain assigned to macOS CI.
