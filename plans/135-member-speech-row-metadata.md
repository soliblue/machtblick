# Member speech row metadata

## Goal

Remove date and contribution-count metadata from debate rows in the member detail speeches tab on web and iOS, without changing other speech surfaces.

## Status

- Lead: in progress
- Designer: complete
- Frontend: complete
- iOS: complete
- Visibility: complete
- Tester: complete
- Deployer: pending
- Scribe: pending

## Scope

- Web member detail speeches rows
- iOS member detail speeches rows
- Focused web and iOS verification
- Web production deployment only

## Contracts

- Member detail speech rows show the debate title, speech excerpt, and full-debate action.
- The row does not show its date, total contribution count, or short-contribution count.
- The optional web vote link remains available.
- Search, grouping, sorting, debate opening, excerpts, and pagination remain unchanged.
- Standalone speech search, vote-detail debates, member tabs, and all other date and count labels remain unchanged.
- Current iOS source already conforms through `ChatInboxRow`; avoid an implementation mutation unless verification finds another member-tab renderer.
- Web is deployed after verification. iOS is committed and verified but not deployed or uploaded.

## Verification

- Focused source contracts cover the absence of member-row date and contribution-count rendering.
- Web TypeScript and production build pass.
- iOS build or project contract checks pass.
- Browser QA covers a member speeches tab with a vote-linked row and confirms other row content and interaction remain intact.
- Production browser QA repeats the focused member speeches flow after deployment.

## Open questions

- None.

## Log

- 2026-07-13 Lead: Confirmed `main` is current and clean, created this plan before implementation, and found that the current iOS `ChatInboxRow` already omits both metadata fields while the web row still renders them.
- 2026-07-13 Designer: Updated the web member-detail speech mocks to omit dates and all contribution counts while retaining each row's title, excerpt, full-debate action, and optional vote link. Left the iOS mock unchanged because it contains no contradictory speech-row metadata and `ChatInboxRow` already matches the contract.
- 2026-07-13 iOS: Audited the member speeches path from `MemberDetailPanel` through `MemberSpeechesPanel` to its sole list renderer, `ChatInboxRow`. The row already shows only title, excerpt, and full-debate action. Added focused source-contract guards against rendering the group date, total contribution count, or short contribution count, and verified `node apps/ios/scripts/check-more-ui-contract.mjs` passes. No iOS UI implementation, upload, or deployment was needed.
- 2026-07-13 Frontend: Removed the date, total contribution count, and short-contribution count from only `MemberSpeechGroupRow`, preserving its localized title, optional vote link, excerpt, and full-debate action. Extended the existing build-time static contract to reject those member-row metadata render paths. The focused contract, web TypeScript check, and diff check pass.
- 2026-07-13 Tester: Playwright against the fresh local production preview passed German desktop, German iPhone 13, and English desktop checks. The target vote-linked row omits its date, contribution count, and short count while retaining its localized title, vote link, excerpt, and full-debate action. The German action opened and loaded the debate dialog on both viewports. All pages returned HTTP 200 with no overlay, console, page, request, HTTP, clipping, wrapping, or horizontal-overflow failures. Screenshots are stored under `/tmp`.
- 2026-07-13 Visibility: Inspected the fresh generated German and English Anna Aeikens speech routes without rebuilding. Each route contains eight rendered speech rows, zero rendered dates, zero contribution-count labels, two vote links, eight excerpts, and eight full-debate actions. Both retain specific localized member metadata, indexable robots, the existing localized preferred `/votes/` canonicals, reciprocal German, English, and `x-default` alternates, and existing JSON alternates whose files are present. Sharing previews, crawler policy, AI discovery, favicons, manifest, sitemap generation, and all other route families are SKIP because the diff does not change those surfaces.
