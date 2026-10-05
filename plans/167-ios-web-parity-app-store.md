# iOS web parity and App Store release

## Goal

Apply the recent web vote-result table and debate-surface improvements to iOS, verify native behavior, and submit a new App Store version.

## Status

Implementation and native verification complete. Apple blocks upload and submission until the operator accepts a pending account agreement.

## Contracts

- Share the native results table between vote detail and linked motion results. Totals precede parties; unknown counts remain distinct from zero.
- Table columns are party, yes, no, abstention, absence, plus no-data when seats are unaccounted for. Sort all parties by membership. Non-roll-call absence is unavailable. Use semantic result colors, shared typography, localized labels, and working party links.
- Port applicable debate and summary styling using shared iOS tokens and adaptive themes.
- Summary carousel cards are transparent with trailing fg/15 separators except the last. Speech cards are transparent and retain member highlights.
- Bring motion detail to the existing web Result, Details, and Speeches tabs with a compact proposer and status header.
- Native motion JSON lacks party results and debate. Load existing full-vote JSON in MotionDetailStore rather than requiring a web data deploy.
- Preserve the existing dirty web, ETL, database, and version work. Stage only this task's files if the release path requires a commit.
- Run native build, contract, and simulator checks before uploading. Submit the new processed build for App Review and verify its final state.
- Keep automatic release after approval, as established by the previous release.

## Open questions

- Select the exact processed release build after native verification.
- Operator must review and accept the pending agreement in App Store Connect Business.

## Ownership

- Results worker: vote models, results models and table UI, VoteDetailView, MotionLinkedVoteCard, table localization. Shared card interface: MotionLinkedVoteCard(vote:detail:) with detail defaulting to nil.
- Surfaces worker: MotionDetailStore, MotionDetailView and its tab/header components, speech and summary surfaces. The store exposes linkedVoteDetails keyed by vote id for the linked card.
- Tester: native result/data contracts, targeted simulator tests, test scenarios, and iOS build workflow verification/artifacts.
- Root: integration, version and release notes, isolated release branch, GitHub build/upload/submission, final state verification.

## Log

- Root: found the September web result-table and plain-debate changes. Initial status showed a native version-config edit that subsequently cleared; current version remains 1.4.
- Explore web: identified null Handzeichen absence decoding, total-only linked-motion JSON, old native charts, party-tinted debate surfaces, and the July motion-tab parity gap.
- Explore release: confirmed authenticated GitHub owner access and macOS CI. Apple lists released version 1.4. Use version 1.5 and an isolated branch from origin/main to avoid publishing the unrelated local ETL commits.
- Tester: added real-data Swift result and motion contracts, native table/navigation/tab tests in German/light and English/dark, horizontal no-data-column interaction, and CI screenshot exports. Confirmed both production locales use Wehrdienst totals 323/272/1/34 and Handzeichen totals 328/299/0 with absence unavailable and three unknown seats. YAML, localization, More UI, release-version, Python syntax, and whitespace checks pass locally; native compile and simulator execution await macOS CI.
- Tester: first macOS run compiled and passed existing gates plus Handzeichen parity. Its exported accessibility tree showed GridRow repeating row identifiers on cell wrappers and motion tabs exposing three labeled buttons directly. Updated test selectors to unique count cells and labeled tab buttons, preserved result/navigation assertions, and added procedure and debate-summary evidence for the next run.
- Root: selected 1.5, updated German/English release notes, and added an App Store upload mode that verifies processing independently of external beta review. Added read-only checks for the attached submitted build, review state, automatic release, and saved localized notes.
- Root: reviewed shared table, optional absence/chamber totals, linked-vote cache enrichment, motion panels, debate surfaces, and targeted tests. Passed 182 bilingual localization keys, 232 settings fields, native More/release contracts, workflow YAML, Python syntax, and whitespace checks.
- Root: CI 37276445923 passed native compilation, published-data decoding/counts, localization bundles, four appearance/language launch scenarios, theme persistence, and scroll navigation. Handzeichen parity passed in both languages/themes. Two test selectors assumed SwiftUI containers that the actual accessibility tree does not expose; corrected them from exported evidence. Reviewed result screenshots and aligned total-cell heights for a uniform background before rerunning.

- Results: added shared native result model/table for vote detail and linked motion cards, with total-first membership order, optional no-data, distinct zero/unavailable values, accessible party links, and Fraunces totals. Full/list absence now accepts null; feeds decode emitted totalMembers and label unaccounted seats separately. Moved unchanged party order enum for UI-free decoder tests. Localization (183 entries), settings parity, and whitespace checks pass; native compilation/rendering remains the CI gate.
- Results: removed unused VoteDonutGrid and its count helper; kept feed/member donut components. Removed two stale section labels after surface integration. All Node gates now pass: 181 bilingual catalog keys, native More contract, 232 settings fields.
- Surfaces: implemented native motion Result/Details/Speeches tabs, compact logo/status/date header, preserved signatories, summaries, timeline and PDF/DIP sources. MotionDetailStore caches full linked-vote payloads; MotionDebateAdapter merges and deduplicates linked debates and summaries. Removed summary/speech party tints and retained highlight borders; carousel separators use shared adaptive fg/15. Local diff check passes; macOS build and simulator verification remain with tester/root.
- Results: visual review identified uneven total shading from differently tall GridRow cells. Matched party/count total-cell heights to 64 using shared tokens and removed repeated row accessibility wrappers, preserving unique count/party elements. Localization, More UI, settings parity, and whitespace checks pass; root reruns native CI/rendering.
- Root: CI 37278961486 passed every native gate, including bilingual table counts, missing-data scrolling, party navigation, and motion tab interactions. Reviewed exported light/dark result, motion, debate, and party screenshots. App Store upload 37281022916 uses the verified cad7bc0 source.
- Root: upload 37281022916 stopped before archiving because pip could not replace Homebrew's cryptography package. Isolated both release workflows in a Python virtual environment and limited certificate cleanup to runs with a successful snapshot. Native source remains unchanged.
- Root: retry 37281442973 reached Apple but certificate listing returned 403. Prepare-only run 37281736322 also received 403 on app lookup. Added Apple's structured error detail to app-lookup failures to diagnose account access before further upload attempts.
- Explore release: issuer-backed team JWTs should omit sub; the shared helper incorrectly sets sub to the key id. Remove that claim and verify ES256 with a generated test key before retrying Apple access. Existing signing secrets support manual signing if provisioning permissions remain unavailable.
- Root: verified corrected team claims and ES256 signature with a generated key. Run 37282036616 returned FORBIDDEN.REQUIRED_AGREEMENTS_MISSING_OR_EXPIRED, stating that an in-effect agreement is unsigned or expired. Asked the operator to review App Store Connect Business. No binary was uploaded or submitted; finish upload and review submission after the agreement is accepted.
