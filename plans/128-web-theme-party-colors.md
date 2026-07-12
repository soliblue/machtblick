# 128 Web Theme and Party Colors

## Goal

Soften party-colored speech surfaces and add website theme selection with System, Light, and Dark modes without changing deployment state.

## Status

- Inspect speech color tokens and existing app theme behavior: complete
- Define the compact website theme control: complete
- Implement theme persistence and dark palette: complete
- Soften party speech colors: complete
- Update mocks and regression coverage: complete
- Verify desktop, mobile, German, English, and theme persistence: complete
- Commit and push: complete with the verified combined batch
- Deployment: intentionally deferred

## Contracts

- Party speech colors keep their party meaning but use a softer effective opacity than the current website treatment.
- The requested softer appearance means reducing effective color opacity, not making the colors more saturated.
- Website theme choices are System, Light, and Dark, matching the iOS app model.
- The compact theme control appears immediately before the existing language picker in the desktop header and remains reachable in the mobile menu.
- System follows the browser or operating-system preference and reacts when that preference changes.
- An explicit Light or Dark choice persists across reloads.
- Theme application does not flash the wrong palette during initial rendering.
- Existing light theme tokens remain the default visual source of truth. Dark mode remaps the shared semantic palette rather than adding per-view overrides.
- German and English labels and accessibility names remain complete.
- Commit and push are authorized after verification. No tag, manual workflow dispatch, or deployment is part of this task.

## Verification

- Static checks cover theme choices, persistence, pre-render initialization, and bilingual labels.
- Rendered QA covers light, dark, system preference, persistence after reload, desktop and mobile access, and softened speech colors.
- Console, error overlay, horizontal overflow, focus, and control interaction checks pass.

## Log

- 2026-07-12 user: requested softer party speech-bubble colors and website dark-theme support matching the app, with a minimal switcher before the language picker.
- 2026-07-12 lead: interpreted the requested softer colors as lower effective opacity because higher opacity would make the colors stronger. Theme scope is System, Light, and Dark with persistent explicit selection.
- 2026-07-12 user: authorized a final commit and push after the combined batch is complete so a collaborator can start from a clean state. Deployment remains out of scope.
- 2026-07-12 designer: inspected the rendered desktop and mobile navigation plus a live vote debate. Added the shared navigation mock with a compact Monitor, Sun, Moon radiogroup immediately before language, including the mobile control row, localized accessibility, persistence, live System behavior, and semantic dark-token contract. Updated vote and member speech mocks so party-summary and conversation bubbles share a quieter effective tint than the current 13% treatment while full party marks retain identity color.
- 2026-07-12 lead: implemented pre-paint theme resolution, persistent explicit choices, live System updates, the adaptive iOS-matched semantic palette, and a localized native radio control before language selection.
- 2026-07-12 lead: reduced all three speech-surface backgrounds from their prior 12% or 13% party mixes to one shared 10% mix, and reduced the member preview border from 28% to 15%.
- 2026-07-12 frontend: audited the rendered dark theme and found white modal scrims, disappearing photo captions, compressed controls below 700px, inherited mobile opacity, spacing drift, and missing radiogroup semantics. The lead corrected every finding and extended static coverage.
- 2026-07-12 frontend: completed a second audit covering first-frame theme resolution, persistence, live System changes, keyboard behavior, 640px and 700px breakpoints, dark overlays, photo captions, and all speech-tint call sites with no remaining findings.
- 2026-07-12 lead: Playwright verified German desktop and English mobile theme controls, initial dark bootstrap, light and dark persistence, System preference changes, native arrow-key selection, responsive ordering, and light and dark member debate bubbles without console or layout errors.
- 2026-07-12 lead: completed the full production build and prerender with the theme and static locale contracts included. The build passed; the existing Katja Mast upstream photo 404 retained its cached image.
