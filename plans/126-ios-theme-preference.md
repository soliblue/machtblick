# 126 iOS Theme Preference

## Goal

Add a persistent iOS appearance preference that follows the phone by default and lets the user choose light or dark mode from More. Tighten the More layout by placing data freshness and sharing directly below the native information links, then ship the verified result to TestFlight.

## Status

- Confirm More row-order intent: done by stated interpretation, no correction received
- Define persistent theme contract: done
- Implement adaptive colors and root wiring: done
- Update More layout, localization, mock, and checks: done
- Verify light, dark, persistence, and language behavior: done
- Commit and push: done
- Public iOS build: done
- Activate and verify the TestFlight build: in progress

## Contracts

- The default preference is `system`, which follows the iPhone appearance without forcing a color scheme.
- Explicit `light` and `dark` choices persist across launches and update the whole app immediately.
- Background, surface, elevated, foreground, border, and secondary tokens adapt semantically. Existing accent and party meanings stay unchanged.
- The More screen keeps native menu pickers, full-width accessible rows, compact dividers, and the existing bilingual copy contract.
- Language and appearance stay together at the top. Data freshness and sharing directly follow About the data, Imprint, and Privacy without the current flexible gap.
- Existing signing secrets, deployment permissions, and the public TestFlight group stay unchanged. External testers are notified so an approved build enters active testing.

## Verification

- Static theme contract covers default persistence, all three choices, root binding, and the absence of a forced light scheme.
- Localization and More UI contracts pass for German and English.
- Xcode build succeeds without signing.
- Simulator verifies system default, explicit light, explicit dark, immediate switching, and persistence after relaunch.
- Public GitHub-hosted iOS build succeeds before the signed TestFlight deployment.
- TestFlight verification confirms the uploaded build is processed and available through the public group.

## Log

- 2026-07-12 user: received the current TestFlight update, requested a tighter More row order, and requested system-default appearance with light and dark overrides followed by commit, push, and deployment.
- 2026-07-12 lead: interpreted the row-order request as moving data freshness and sharing directly under the three native information links while keeping Language and Theme together at the top. Asked for correction during implementation if the intended order differs.
- 2026-07-12 designer: confirmed the order Language, Appearance, information links, freshness, sharing, and version. Required full-row native pickers, dynamic semantic canvas colors, dark launch and accent assets, and explicit filled-result foreground colors.
- 2026-07-12 lead: added persistent `system`, `light`, and `dark` choices with `system` as the missing or unknown fallback. Root state drives an optional preferred color scheme, so appearance changes do not rebuild navigation or data stores.
- 2026-07-12 lead: replaced the fixed canvas with adaptive iOS background, surface, elevated, and label colors. Added fixed on-fill semantics for success, danger, and yellow after contrast review, plus dark launch and accent asset variants.
- 2026-07-12 lead: made Language and Appearance full-width accessible menu pickers, removed the flexible gap after Privacy, updated both localized mocks and all release contract checks, and added a dedicated UI test target that switches themes immediately and verifies persistence across relaunches on a dark simulator.
- 2026-07-12 lead: local localization, Settings parity, More UI, Actionlint, asset JSON, scheme XML, project-structure, and diff checks pass. Xcode compilation and UI execution remain the public macOS gate because the current host has no Xcode runtime.
- 2026-07-12 public Mac: run `29187237954` compiled the app and UI-test target, passed all contracts, launched the four seeded language and appearance combinations twice each, and passed immediate System, Light, Dark, and relaunch persistence through the real More control.
- 2026-07-12 lead: artifact inspection caught that menu-style `Picker` suppressed its custom icon and title in the custom scroll layout even though behavior and accessibility passed. Replaced that rendering with a full-width native `Menu` using direct checked choices, retained the same persistence binding and accessibility contract, and added a render-settle delay before screenshots. A second public Mac run is required before deployment.
- 2026-07-12 public Mac: run `29187584961` passed every contract, all four seeded launch and relaunch scenarios, and the real in-app appearance UI test. Artifact inspection confirmed stable labels, icons, ordering, light mode, dark mode, system mode, immediate switching, and persistence.
- 2026-07-12 scribe: committed the implementation as `ab462d7` and the corrected appearance row rendering as `8eee194`, then pushed both to `main`.
- 2026-07-12 deployment: build 32 processed as valid, passed beta review, and joined the public group, but remained `BETA_APPROVED` because the lane disabled external tester notifications. The strict availability check correctly rejected that incomplete state, and the run revoked its temporary certificate and cleaned up signing material.
- 2026-07-12 lead: retained the `IN_BETA_TESTING` release gate and added external tester activation to the release path instead of treating approval alone as deployment.
