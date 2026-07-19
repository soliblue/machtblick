# iOS Vote Search

## Goal

Add native, localized vote search to the iOS vote feed and the member detail voting record.

## Status

- Lead: delivery in progress
- Frontend: static review complete
- Tester: static checks complete, Simulator unavailable on this host
- Scribe: commit pending

## Shared Contracts

- Search vote titles in both the cleaned and official title fields.
- Combine search with every existing vote feed filter and saved or seen state.
- Use SwiftUI searchable with minimized toolbar behavior on the main vote feed.
- Place the main vote filter and native search controls together in the top toolbar.
- Match the existing member speech search field inside the member voting tab.
- Keep search state local to its screen or owning feature store.
- Add German and English search copy.
- Describe vote search in the German and English TestFlight release notes.

## Open Questions

- Verify the top toolbar, expanded search, and filter sheet together on an iOS 26 Simulator when a Mac host is available.

## Log

- 2026-07-18 lead: Created the plan after reviewing the existing iOS search components, vote filters, member detail panels, and current Apple search guidance.
- 2026-07-18 lead: Chose minimized native toolbar search for the main feed and the existing inline SearchField pattern for member vote history.
- 2026-07-18 lead: Added title search to the vote store, paired the filter and minimized search in the bottom toolbar, reset the paged feed when the query changes, and added inline member vote search.
- 2026-07-18 frontend: Static review passed the iOS 26 toolbar APIs, observation pattern, filter composition, localization, and keyboard dismissal.
- 2026-07-18 tester: Localization and diff checks passed. Runtime verification could not run because this host has no xcrun or Swift toolchain.
- 2026-07-19 lead: Corrected the main feed contract after the user clarified that search and filter belong in the top toolbar.
- 2026-07-19 lead: Moved both controls to the top trailing toolbar with the minimized search next to the filter.
- 2026-07-19 lead: User requested commit, push, and delivery to their phone for testing.
- 2026-07-19 lead: Updated the TestFlight release notes to describe vote search instead of the prior theme release.
- 2026-07-19 lead: Linux-safe localization, Settings parity, More UI, release version, Python syntax, and diff checks passed. Ruby, Swift, and Xcode checks remain assigned to GitHub Actions on macOS.
