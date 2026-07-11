# Web and iOS parity

## Goal

Bring the Bundestag web app closer to the current iOS product design while preserving useful web URLs, localization, prerendering, and desktop ergonomics.

## Status

All implementation and release gates passed. Commit, push, and production deployment are in progress under the user's approval.

## Reference

The current SwiftUI app under `apps/ios/src` is the product reference for information architecture, component anatomy, reading typography, and debate interactions.

## Recommended contracts

- Primary navigation contains votes, members, and parties.
- `/speeches/` and `/motions/` remain prerendered secondary routes for search, deep links, and contextual navigation.
- Saved, seen, and unseen vote state is local browser state with no account synchronization.
- Vote, motion, and member debates use the same reusable conversation components.
- Speech turns expand inline. The separate per-speech reader is not the primary debate interaction.
- Party summaries are fully expanded party-tinted horizontal bubbles, fixed at 320px on mobile and 400px on desktop, with the party logo and participating speaker avatars.
- Presidium and procedural contributions render between full-width rules.
- Member speech lists use inbox rows and open the full debate with that member highlighted.
- Member list cards use portrait photography, overlaid names, and party marks. Comparison metrics remain on detail pages.
- Party list cards use single-column rows with a party-color dot after the chamber seat map.
- Party detail is one scroll containing a color-dot header, demographics, proposals, alignment, donations, and history.
- Party proposals open a filtered vote feed.
- Visible party profile, vote, and history tabs are removed. Existing nested URLs remain compatible through redirects or equivalent route handling.
- The party success-rate block and embedded party vote list leave the primary party page.
- Vote and member detail selectors use the iOS segmented-control anatomy while remaining URL-addressable where the web benefits from it.
- Motion detail follows header, procedure, subjects, summary, signatories, linked votes, debate, and source.
- Motion subjects use a horizontally scrollable chip strip.
- Lora is committed and used for summaries, motions, and speeches. Fraunces remains the display face.
- The richer web linked-vote visualization remains where desktop space makes it useful.

## Web-specific exceptions

- Desktop vote feeds do not use full-height scroll snapping.
- English routes and all currently useful indexed detail routes remain available.
- Pull to refresh, haptics, native sheets, and navigation-stack behavior are not copied literally.
- Desktop layouts may use multiple columns when they preserve the same content order and component anatomy.

## Work slices

1. Shared typography, segmented control, conversation bubble, system row, and avatar pile primitives.
2. Vote debate and party-summary conversion, saved and seen state, compact defector rows.
3. Member portrait cards, detail header parity, speech inbox, and full-debate presentation.
4. Party list rows, consolidated detail page, proposal feed linking, and legacy route compatibility.
5. Motion subject chips, content order, and shared debate conversion.
6. Primary navigation cleanup, secondary route discoverability, localization, prerender paths, and browser verification.

## Verification

- Compare vote feed, vote detail, member list, member detail, party list, party detail, and motion detail at mobile and desktop widths.
- Verify German and English routes, browser back and forward behavior, keyboard access, saved and seen persistence, and speech search highlighting.
- Run `npm run build -w @machtblick/bundestag`.
- Run browser smoke checks for all changed routes.

## Decisions

- Primary navigation is exactly votes, members, and parties.
- Visible party tabs and the embedded party vote list are removed.
- Saved and seen state is browser-local.
- Do not commit or push before user testing on `dev.machtblick.de`.

## Log

- Lead: audited current iOS and web navigation, vote, member, party, motion, and speech implementations.
- Designer: identified the primary parity gaps and recommended preserving web routing while adopting iOS component anatomy.
- Explorer: mapped all iOS surfaces to current web routes and confirmed the largest divergences are party detail and speech presentation.
- Designer: rewrote the vote debate, member speech, party list, and party detail ASCII contracts for the parity direction.
- Lead: reviewed the mocks against the current SwiftUI source and corrected party identity and party-summary behavior.
- User: approved all recommended contracts and requested an uncommitted dev preview before any commit or push.
- Frontend: added Lora, reusable conversation bubbles, system rows, avatar piles, segmented controls, local saved and seen vote flags, member speech inboxes, and the full-debate dialog.
- Frontend: converted member cards to portrait tiles, consolidated party detail into one scroll, simplified the primary navigation, and aligned motion detail order and subject chips.
- Lead: integrated German and English routes, canonical party URLs, legacy party redirects, sitemap generation, i18n, and updated ASCII contracts.
- Lead: TypeScript and `git diff --check` passed. The first full prerender exited late without a retained diagnostic, so a clean logged build and browser verification remain open.
- User: requested less abrupt horizontal rail clipping and shorter party summary cards. Lead widened party summaries, kept rails within the app column, added a soft edge fade, and moved rail padding to the inner track so the final item remains fully reachable.
- Lead: browser evidence showed flex cross-axis stretching was making every party summary as tall as the longest card. Added top alignment so each bubble now fits its own content without truncation.
- User: reported the language menu disappearing while crossing into the English option and requested flag-only controls. Lead removed the hover gap, added focus-within continuity, and reduced desktop and mobile language choices to accessible flag controls.
- User: rejected viewport-derived party summary widths. Lead replaced them with explicit 320px mobile and 400px desktop widths.
- Lead: browser logs exposed the shared tooltip switching between uncontrolled and controlled mode after touch detection. Kept the root controlled for its full lifetime to remove the warning.
- User: requested softer rail edges and the iOS vote-feed divider treatment. Lead changed the rail mask to a partial 16px fade, removed vote-card borders, and added inset `elevated` dividers between vote surfaces on mobile and desktop.
- Tester: passed the German and English route matrix at 390x844 and 1440x1000, including saved and seen filters, debate expansion, member highlight dialog, party redirects, subject order, rail end states, horizontal overflow, and console errors.
- Lead: focused browser checks confirmed party summaries are exactly 320px mobile and 400px desktop, the language menu remains visible while crossing to English, vote surfaces have no border or shadow, dividers use the `elevated` gray token, rail masks are active, and the tooltip warning is gone.
- Lead: final TypeScript, diff, and full production build checks passed after the last visual adjustments. The root build prerendered the complete German and English route set, including canonical and legacy party routes.
- User: requested that remaining sharp bordered controls and surfaces use softer corners. Lead selected the existing 8px `rounded-s` token while preserving square result stamps and divider-only rows.
- Lead: applied radius-s to bordered search fields, filters, menus, chips, empty states, cards, tooltips, icon controls, and desktop dialogs. Speech excerpts use radius-m to remain in the conversation-bubble family.
- Lead: computed browser styles exposed `rounded-s` as an ambiguous Tailwind utility that produced 4px left and 8px right corners. Replaced it across the app with `rounded-[var(--radius-s)]` so all four corners resolve to 8px.
- User: requested removing Sammelübersichten from both web and iOS vote feeds. The database has 75 current bundles, all handzeichen and all correctly flagged. Lead excluded `is_petition_bundle` rows from the web list, static iOS API feed, and Atom vote feed while preserving direct detail routes.
- Lead: found that two ordinary shipping-law votes contain incorrect generated petition summaries. They are not bundle rows and remain visible pending a separate data-quality correction.
- Lead: post-build data checks found 223 iOS feed rows, 59 namentlich and 164 handzeichen, with zero bundle rows. The 50-entry Atom feed also contains zero bundle entries.
- Lead: production build passed with 7,734 prerendered pages. Browser checks found zero bundle titles in either vote list, preserved direct detail routes, no page errors, and symmetric 8px corners across the audited routes.
- User: requested removing the numeric counts beneath member-detail tab labels. Lead removed the secondary count lines and changed the tab shell to the visible 14px radius token while retaining counts only for deciding which tabs exist.
- Lead: browser verification found only the `Abstimmungen` and `Reden` labels, with all four outer corners resolving to 14px. TypeScript passed.
- User: clarified with the desktop vote screenshot that 8px controls still read as sharp. Lead moved framed controls, cards, menus, dialogs, chips, and tabs to radius-m, while adding radius-s to the ink-style result stamp.
- Lead: browser verification confirmed 14px on all four corners of the language and vote-filter controls. The vote feed remains borderless with inset dividers. TypeScript and diff checks passed.
- User: showed that the stamp updated while filter and language selectors remained square in their browser session. Lead replaced the newly generated arbitrary radius classes with the existing stable `rounded-m` utility across the app.
- Lead: local computed styles and external dev HTML now confirm the language selector and all five vote-filter controls use the stable 14px utility on all four corners.
- User: found the rounded vertical language dropdown visually awkward. Lead replaced it with a permanently visible horizontal DE/EN segmented control using one border and a subtle selected state on desktop and mobile.
- Lead: browser verification confirmed a 74 by 34px desktop control, two accessible language links, 14px outer corners, no hover dependency, and no mobile overflow. TypeScript and diff checks passed.
- User: approved the complete work for commit, push, and production deployment.
- User: paused the release to request a cleaner default link-preview image after showing the existing clipped and overcrowded card.
- Lead: moved the default 1200 by 630 preview into the checked-in OG generator, replaced the clipped headline and boxed categories with a short brand statement, and regenerated `public/og-image.png`.
- Visibility: found the generated sitemap now includes German and English motion indexes, but `llms.txt` still described the removed party profile route as canonical. Lead corrected it to the consolidated party detail URL.
- User: clarified the final release scope after pausing the gates. Party summary bubbles must share the tallest summary height on web and iOS, vote lists must have no default vote-type filter on web and iOS, and the web link-preview image should use the browed eye mark from the website header. The iOS app icon remains unchanged.
- User: additionally approved changing the web favicon to the same browed eye mark, while keeping the iOS app icon unchanged.
- Frontend: changed the German and English vote routes to start with no type filter and updated the default German page title. The default feed now includes both named and handzeichen votes.
- Frontend: changed web party summary rails to stretch every bubble to the tallest summary. Browser measurement on a five-party rail returned five identical 553px heights.
- iOS: removed the initial named-vote filter and added an explicit equal-height horizontal layout for party summary bubbles.
- Lead: updated the OG and favicon generator to use the exact browed eye geometry from the website header, then regenerated the default preview, SVG favicon, 16px and 32px favicons, and touch icon. The iOS app icon remains unchanged.
- Lead: final TypeScript, diff, and production build checks passed. The build generated the default preview, 59 vote previews, 5 party previews, and 7,734 prerendered pages.
- Tester: passed the final 1440 by 1000 and 390 by 844 matrix for the mixed default feed, named and handzeichen filters, Sammelübersicht exclusion, equal-height party summaries, member tabs, language controls, overflow, and console/page errors.
- Visibility: passed the final generated preview and favicon assets, DE/EN metadata, sitemap, crawler policy, manifest, and AI discovery gate with no blockers.
- Lead: iOS compilation was unavailable on this Linux host because Xcode and Swift tooling are not installed. The iOS changes were reviewed directly and `git diff --check` passed.
