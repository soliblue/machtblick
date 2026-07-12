# 127 Source Links and Linke Vote Arrow

## Goal

Link the public Machtblick source repository from the website and the iOS More screen, then restore the missing member-to-party vote connector for Die Linke without changing deployment state.

## Status

- Confirm source-link placement and bilingual copy: complete
- Diagnose the Die Linke connector mismatch: complete
- Implement website and iOS changes: complete
- Add regression coverage and update mocks: complete
- Verify web and iOS behavior: complete locally, with the iOS compiler check delegated to the push-triggered macOS build
- Commit and push: complete with the verified combined batch
- Deployment: intentionally deferred

## Contracts

- The canonical source URL is `https://github.com/soliblue/machtblick`.
- Compact navigation and settings labels are `Daten` and `Code` in German, and `Data` and `Code` in English. Full page titles remain unchanged.
- The website exposes a bilingual source-code link from its shared footer so it is reachable throughout the app.
- The iOS More screen exposes the same link as a full-width accessible external-link row near About the data, Imprint, and Privacy.
- Existing More ordering, appearance persistence, and language switching remain unchanged apart from the added row.
- Member vote connectors show the member choice, direction, and party line consistently for every canonical Bundestag party, including Die Linke.
- The connector fix belongs in shared party or vote derivation when the mismatch originates in data naming, not in a Die Linke-only rendering branch.
- Commit and push are authorized after the combined batch passes verification. No tag, manual workflow dispatch, or deployment is part of this task.

## Verification

- Website checks cover German and English source-link labels and the exact external URL.
- Rendered website QA verifies the footer link is visible, opens the repository, and introduces no console or layout regression.
- iOS static contracts cover bilingual copy, row ordering, URL wiring, and the Die Linke connector case.
- Available compiler and project checks pass locally; macOS-only build limitations are reported rather than bypassed.

## Log

- 2026-07-12 user: requested public source-code links on the website and iOS settings, reported a missing vote-to-party arrow for Die Linke members with a dark-mode screenshot, and explicitly deferred deployment because more changes are coming.
- 2026-07-12 lead: selected the shared website footer for global discoverability and the existing More information group for iOS, pending repository inspection. The screenshot shows member and party labels but no directional connector between them.
- 2026-07-12 frontend: confirmed the shared bilingual footer and the existing iOS More information group as the smallest consistent placements for the canonical repository link.
- 2026-07-12 plumber: audited all 64 Die Linke member profiles, 3,769 published history rows, and 3,776 database rows. Party names and summaries match exactly. The missing connector comes from a legacy cached member payload created before party summaries were added.
- 2026-07-12 lead: added bilingual source-code links to the website footer and iOS More screen. Legacy member payloads remain visible offline but now trigger an immediate enrichment refresh instead of waiting for the one-day cache expiry.
- 2026-07-12 lead: extended the iOS payload contract, More screen contract, and static locale audit to cover the source link, stale enrichment refresh, and exact member-party summary matching.
- 2026-07-12 tester: verified German and English footers with Playwright at desktop and 390-pixel widths. The exact URL, new-tab behavior, safe relationship attribute, internal footer navigation, wrapping, horizontal overflow, and browser console all passed.
- 2026-07-12 lead: completed the Bundestag production build and prerender, TypeScript, localization, settings parity, static locale, JSON, diff, and repository hygiene checks. The build retained the existing Katja Mast photo after its upstream URL returned 404. Swift compilation was unavailable on this Linux host and no public macOS workflow was triggered because push and deployment are deferred.
- 2026-07-12 user: requested shorter labels to save horizontal space.
- 2026-07-12 lead: shortened the website footer and iOS More labels to localized Data and Code variants while preserving the full About-data page titles.
- 2026-07-12 user: authorized a final commit and push after the broader visual batch is complete so a collaborator can begin from a clean state. Deployment remains out of scope.
- 2026-07-12 lead: reran the complete website production build, prerender, static locale audit, iOS localization and Settings contracts, TypeScript, JSON, and repository hygiene checks after the combined batch. All passed locally; the existing Katja Mast upstream photo 404 retained its cached image.
