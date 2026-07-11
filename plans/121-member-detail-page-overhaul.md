# Member Detail Page Overhaul

## Status

Implemented and verified for web. Speech-row redesign remains a visual exploration only.

## Goal

Simplify the member-detail page around two useful surfaces, voting history and speeches, while replacing the current voting ledger with a compact version of the main vote card that makes the selected member's ballot the lead signal.

The visual source is the normal card on `/votes`. The existing member-detail vote row is not a design reference and should be replaced rather than polished.

## Current State

The member voting record renders divided rows with:

- Member choice
- Vote title
- Vote date
- Chamber outcome
- Party-line deviation when applicable

The main vote card additionally renders:

- Proposing party
- Result stamp
- Generated summary
- Chamber hemicycle
- Party result donuts

`MemberVoteRow` does not currently carry the proposing party or party result summaries.

The member detail currently also exposes:

- `Linie` and `Stimme` filters above the voting history
- An `Anträge` tab and member-specific motions route
- A defection metric that links to the `Linie` filter

## Simplification Decisions

- Remove the `Linie` and `Stimme` filters from the member voting history.
- Show the complete voting history in newest-first order.
- Remove the member-detail `Anträge` tab and page.
- Remove member-initiative loading from the web member-detail payload when no remaining web surface consumes it.
- Redirect the legacy member motions URL to the member voting page so existing links do not become dead ends.
- Make the defection metric a subtle URL-backed toggle without restoring visible filter controls.
- Retain only `Abstimmungen` and `Reden` in the member-detail segmented navigation.

## Proposed Compact Card

- Lead with a clearly labelled member ballot, such as `STIMME: NEIN`.
- Keep proposing party, chamber result stamp, clean title, and compact party result donuts.
- Remove the generated summary and chamber hemicycle.
- Keep party-line deviation directly beside the member ballot so it cannot be confused with the chamber outcome.
- Use the existing quiet divider rhythm rather than heavy nested cards.
- Preserve the full-card link target and accessible result context.
- Support `Ja`, `Nein`, `Enthalten`, and `Nicht abgegeben` without changing card dimensions.

## Proposed Speech Card

- Replace the current inbox row and bordered party-tinted excerpt bubble.
- Match the compact vote card's typography, spacing, surface, and metadata rhythm.
- Keep debate title, date, contribution count, short-contribution count, linked vote when present, and a short excerpt.
- Make the full card open the debate instead of repeating a prominent `Ganze Debatte ansehen` command below every excerpt.
- Keep the member's words as the strongest content after the debate title.
- Preserve search on the speeches page unless a later decision removes it.

Speech-card redesign is deferred. The current design round focuses only on the compact member vote card.

## Information Hierarchy

1. Member ballot
2. Vote title
3. Party-line deviation
4. Chamber result
5. Proposing party
6. Party result distribution

## Preferred Direction

```text
+------------------------------------------------+
| [SPD]                              ABGELEHNT |
|                                                |
| STIMME: [ NEIN ]   ABWEICHUNG VON SPD: JA     |
|                                                |
| Buergergeld-Reform: Sanktionen neu ordnen     |
|                                                |
|  (o)      (o)      (o)      (o)      (o)      |
| CDU/CSU   SPD     GRUENE    LINKE     AFD      |
+------------------------------------------------+
```

- The choice uses a compact filled semantic badge with an explicit `STIMME` label.
- The chamber result keeps the existing outlined stamp treatment.
- A deviation appears on the same line as the ballot, never beside the chamber stamp.
- The title uses the existing display type and remains the dominant content block.
- Party donuts shrink slightly but retain the same ordering and interaction model.
- Repeated votes use soft full-width surfaces or quiet separators, not nested cards.
- Composition, typography, proposer placement, result stamp, and party donuts inherit directly from the `/votes` card.
- The current member-detail left choice pill and ledger-row layout do not carry forward.

## Design Deliverable

- Eight high-fidelity compact member vote-card concepts.
- Eight high-fidelity compact member speech-row concepts.
- Two high-fidelity compact member-header concepts based on the live mobile page.
- The concept is for evaluation only and is not a production asset.
- The first concept included filters and an `Anträge` tab. Implementation must omit both based on the subsequent simplification decision.

## Visual Preferences

- Compact and easy to scan
- Visually informative before reading supporting text
- Calm and easy on the eye
- Consistent with the existing `/votes` card and Machtblick editorial typography
- Creative in information hierarchy, not decorative styling
- Clear distinction between the member ballot, party majority, and chamber result
- Stable dimensions across all ballot states
- No summary or hemicycle

Variant 6 is selected. It keeps the normal vote-card header and title, follows with a compact member ballot and line-status marker, then highlights the member's party donut with its majority choice.

Semantic color is tied to the value:

- `JA` uses success green.
- `NEIN` uses danger red.
- `ENTHALTEN` uses yellow.
- `NICHT ABGEGEBEN` stays neutral.
- `LINIE` uses success green when the member matches the party majority.
- `ABWEICHUNG` uses danger red when the member differs from the party majority.

## Open Questions

- Whether party result donuts remain useful enough to justify expanding `MemberVoteRow`.
- Whether the member ballot should be a filled chip, a left status column, or a full-width strip.
- Whether the remaining `Abstimmungen` and `Reden` navigation stays segmented or moves toward the continuous party-detail layout in a later change.
- Whether the card should show a compact proposer logo or proposer text when space is constrained.

## Verification

- `npm exec tsc -- -p apps/bundestag/tsconfig.json --pretty false`
- `npm run build -w @machtblick/bundestag`, 6,456 pages prerendered with no member-motion pages
- Playwright at 1440x900 and 390x664 verified compact vote cards, title wrapping, two-tab navigation, German and English parity, and no horizontal overflow.
- Jan Dieren's deviation toggle changed the list from 59 to 12 cards, changed the count from weight 400 to 600, and restored the full list on the second click in both locales.
- Stefan Seidler's portrait credit opened on the first iPhone tap and closed on an outside tap.
- Legacy German and English member-motion routes redirect directly to voting pages.
- Visibility passed for metadata, canonical and alternate links, JSON-LD, crawler access, AI discovery, redirects, sitemap entries, and static prerender coverage.
- Browser console, page-error, and framework-overlay checks were clean.

## Agent Log

### Lead, 2026-07-11

- Inspected the current member vote row, main vote card, member payload, and existing member-detail layout contract.
- Identified the data fields required for a compact main-card equivalent.
- Started a visual concept before changing the React or server contract.
- Selected an explicit ballot row plus chamber stamp as the clearest way to distinguish the member's vote from the Bundestag result.
- Clarified that the `/votes` VoteCard is the design source and the existing member voting row is intentionally discarded.
- Expanded the plan into a member-detail page overhaul.
- Recorded the decisions to remove voting filters and the member-specific Anträge surface.
- Added a matching speech-card redesign and four distinct card-system directions for visual review.
- Deferred the speech-card redesign and narrowed visual exploration to eight compact vote-card variants based on the first unified-band concept.
- Recorded the preference for visual, compact, calm, informative, creative, and site-consistent presentation.
- Selected variant 6 with semantic ballot colors and a highlighted party-majority donut.
- Matched variant 6's connector with a horizontal rule and a vertical arrow landing on the highlighted party donut.
- Centered the ballot status and made the connector leave its nearest edge based on the highlighted donut position.
- Enabled locale-aware native hyphenation for compact and normal vote-card titles.
- Added more separation between the ballot status and party donut row.
- Removed vote-card borders and radii in favor of the `/votes` feed's inset elevated dividers.
- Made every connector leave the centered status row from its bottom edge and removed the status container chrome.
- Applied the small radius token explicitly to every side of the member ballot badge.
- Removed the majority caption beneath the highlighted party donut.
- Started a compact member-header exploration covering balanced two-column and dense horizontal stat layouts.
- Replaced the persistent portrait credit line with an overlaid, touch-accessible attribution tooltip.
- Replaced member attendance and loyalty bars with the shared percentage donut anatomy.
- Made selected tab corners concentric with the surrounding picker radius.
- Removed the experimental stat donuts in favor of centered values with labels and supporting counts.
- Moved the party logo directly before the member name and removed the separate party metadata row.
- Expanded the speech-tab redesign into eight compact, site-consistent visual directions for selection before implementation.
- Replaced the old member voting ledger with the selected compact card.
- Removed voting filters and reduced member navigation to Abstimmungen and Reden.
- Redirected legacy member motions URLs and removed unused member-motion web code.
- Expanded the member vote payload with proposer and party-summary data already available in the existing query.
- Broke the connector once at its midpoint for party-line deviations while keeping matching party-line connectors continuous.
- Filled the deviation connector gap with a small lightning-shaped crack that follows the connector orientation.
- Detached the deviation lightning bolt from both line ends and kept it upright regardless of connector direction.
- Colored deviation connectors by meaning: member ballot before the red bolt, party majority after it, with the arrowhead matching the party segment.
- Removed the date from compact member vote cards and aligned proposer and result stamp to opposite header edges.
- Made the nonzero deviation count toggle `?line=abw`, visually emphasize its active state, and filter the compact vote list in both locales.
- Made the portrait credit tooltip controlled so its first tap opens reliably on touch screens.
- Removed obsolete member-motion prerender entries, added direct permanent redirects for German and English legacy URLs, and updated `llms.txt` to match the two-tab member surface.
- Made shared tooltip triggers recognize touch pointer events immediately so portrait credits open on the first tap.
- Deferred touch tooltip opening until after pointer-up so Radix cannot close it later in the same tap cycle.
- Replaced the portrait credit tooltip with an accessible local info popover after browser verification showed Radix still closed controlled tooltips on touch.
- Made the credit trigger idempotently open on click so touch focus and click cannot cancel each other in the same tap.
- Passed focused desktop and iPhone browser checks, visibility review, TypeScript, and the final 6,456-page production build.
