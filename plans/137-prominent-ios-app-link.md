# Prominent iOS app link

## Goal

Make the Machtblick iOS App Store destination easier to discover from the web app without disrupting the primary Bundestag content.

## Status

Complete.

## Shared contract

- Safari receives the native Smart App Banner through root metadata.
- The one-time custom modal appears on iPhone browsers that do not receive the native Safari banner.
- A localized App Store link remains visible in the shared footer on every browser and device.
- The App Store destination is `https://apps.apple.com/us/app/machtblick/id6787755187`.
- The native banner and custom modal must not appear together on the same Safari visit.
- The footer treatment follows the existing quiet secondary-link hierarchy.

## Verification

- Root HTML contains `apple-itunes-app` with App Store ID `6787755187`.
- iPhone Safari does not render the custom modal.
- iPhone Chrome renders the custom modal once.
- Desktop does not render the custom modal.
- German and English footers expose the localized persistent App Store link.

## Log

- Lead: Inspected the existing App Store prompt, navigation, footer, copy, and tests. Requested designer and visibility recommendations.
- Lead: User prefers keeping the custom modal while also adding the native Smart App Banner and a persistent footer link. Main design constraint is avoiding simultaneous duplicate prompts on a first iPhone Safari visit, not avoiding the three surfaces altogether.
- Designer: Reviewed the shared navigation, mobile menu, footer, one-time iPhone Safari modal, and their mocks. Three viable concepts follow.
  1. Native Safari Smart App Banner. Add the App Store identifier to site metadata so iPhone Safari owns a trusted banner with the app icon and a Get or Open action. Retire the custom one-time modal to avoid two competing interruptions. This is the most prominent and idiomatic iOS treatment, but Safari controls its appearance and it does not build awareness on desktop or non-Safari browsers.
  2. Persistent navigation action. Add `iPhone-App` or `iPhone app` as a quiet utility link before the desktop appearance controls and as a separated action below the three primary links in the mobile menu. This stays recoverable on every page, but the desktop row is already tight near the 700px breakpoint and promoting a platform destination beside content navigation can compete with Abstimmungen, Abgeordnete, and Fraktionen.
  3. Dedicated footer promotion. Place a full-width row above the existing legal and secondary links, using the app icon, one short localized sentence, and an App Store action. This gives every visitor a durable destination without crowding navigation, but it is less discoverable on long pages and snap feeds because visitors may rarely reach the footer.
- Designer recommendation: Start with the native Safari Smart App Banner and replace the custom modal. It directly serves iPhone discovery and recovery with less custom UI and no new navigation pressure. If the product goal expands to general awareness across devices, pair it later with the dedicated footer row. Do not add the desktop navigation action unless acquisition data shows the footer is too weak.
- Designer recommended concept, approximate browser-owned layout:

  ```text
  +---------------------------------------------+
  | [x] [app icon] Machtblick        [ OPEN ]   |
  |                  Bundestag im Blick         |
  +=============================================+
  | Machtblick                               ☰  |
  +---------------------------------------------+
  |                                             |
  |            current route content            |
  |                                             |
  +---------------------------------------------+
  ```

  The banner is an iPhone Safari surface, not a new site component. Exact labels and chrome remain browser-owned. Site navigation and content keep their existing geometry after the banner is dismissed.
- Frontend: Added root `apple-itunes-app` metadata with `app-id=6787755187`. Changed the one-time custom prompt to target iPhone user agents that do not match native mobile Safari, leaving Safari to the native banner. Added the persistent App Store destination to the shared footer with `iPhone-App` and `iPhone app` copy. Updated the footer and prompt mocks to match the accepted browser split and footer treatment.
- Frontend verification: `git diff --check` passed. `npx tsc -p apps/bundestag/tsconfig.json --noEmit` passed. Focused Playwright coverage passed 5 of 5 checks for root metadata, iPhone Safari prompt absence, iPhone Chrome one-time prompt behavior, desktop Safari prompt absence, and German and English footer links.
- Tester: Ran six scoped Playwright cases at `http://localhost:3001` because port 3000 was occupied by an unrelated service. Metadata, iPhone Safari suppression, iPhone Chrome first-show and reload suppression, both localized footer links, and English Motions navigation all passed their functional assertions. Four cases passed cleanly. The two iPhone Chrome cases failed console health because opening the Radix dialog during hydration adds `aria-hidden` attributes before React finishes hydrating, producing the same React hydration-mismatch error in both cases. Screenshots: `/tmp/tester-plan-137-custom-modal.png` and `/tmp/tester-plan-137-footer.png`.
- Frontend: Deferred the eligible custom prompt by a cancellable two-second timer so nested route hydration settles before Radix applies modal accessibility attributes. The local-storage key is still written only when the prompt actually opens, and unmount cleanup cancels the pending open.
- Frontend verification: `npx tsc -p apps/bundestag/tsconfig.json --noEmit` passed. The focused iPhone Chrome Playwright case passed with an empty console and page-error collection. Lead independently reran the full focused spec against port 4174 and confirmed 5 of 5 cases passed, including Chrome console health.
- Tester final verification: Re-ran both iPhone Chrome cases after the timing fix. First-show and reload suppression passed 2 of 2 with no console or page errors after waiting beyond the two-second delay.
- Lead: Reviewed the final diff and successful screenshots. The accepted Smart App Banner, segmented custom prompt, and persistent localized footer link are complete.
- Tester final verification: Reran only the two previously failing iPhone Chrome cases at `http://localhost:3001`. First-show rendered the custom dialog after the hydration delay with no console or page errors. Reload suppression remained effective beyond the two-second delay with no console or page errors. Both cases passed, 2 of 2.
