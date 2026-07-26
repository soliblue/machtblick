# 151 Berlin candidate detail tabs

## Goal

Bring Berlin candidate details into the accepted Machtblick member-detail hierarchy with top identity metadata and conditional biography, personal programme, and party tabs.

## Status

- accepted concept inventory: complete
- conditional tab model: complete
- identity header redesign: complete
- tab content integration: complete
- fidelity and interaction QA: complete
- public tunnel verification: complete
- biography panel heading cleanup: complete
- programme reading typography: complete

## Product contract

- The accepted first generated concept is the visual source of truth.
- Occupation and birth year belong in the top identity metadata.
- Tabs appear in this order: Biografie, Persönliches Programm, Partei.
- A tab only appears when its candidate has meaningful content.
- The first available tab is selected by default.
- Personal statements and party positions remain clearly separated.
- The original-source notice stays one click away near the top.
- Existing shared typography, spacing, radius, and color tokens remain authoritative.

## Accepted concept inventory

- Source: first generated mobile concept, `call_iGqBMg5VVSmsndmowONUV3OM.png`.
- Canvas: true white, open editorial layout, `max-w-3xl`, shared `px-l` gutters.
- Identity: 112px circular initials surface beside party, name, occupation, and Jahrgang metadata.
- Ballot facts: open two-column display numerals with captions and hairlines.
- Trust: one `rounded-m` surface linking the primary original source.
- Tabs: Machtblick segmented control with one equal column per available section.
- Typography: Fraunces display name and numerals, system sans captions and controls, Lora content.
- Color: theme tokens only, with party color limited to the identity dot and personal-priority rule.
- Allowed top copy: party, candidate name, occupation, Jahrgang, candidacy labels, ballot values, district, source notice, and available tab labels.
- Intentional deviation: initials replace the portrait because candidate image data is not available; the photo attribution control is omitted.

## Fidelity ledger

- Identity: accepted circular portrait slot becomes the same 112px and 128px initials fallback used by Machtblick members.
- Metadata: occupation and `Jahrgang` sit beneath the name in the shared uppercase caption treatment.
- Ballot facts: candidacies remain open two-column Fraunces display values with hairline structure.
- Trust: the original-source notice keeps the accepted `rounded-m` surface and one-click link.
- Navigation: the requested three equal-width segments use the exact Machtblick member-tab container and selected state.
- Density: mobile shows identity, ballot facts, source notice, tabs, and meaningful tab content in the first 844px viewport.
- Copy: the only additions above the content are the requested conditional tab labels; no unapproved headline, badge, or helper copy was introduced.
- Intentional deviation: Biografie is the default instead of the concept's priority list because the operator explicitly made it the first tab.

## Log

- 2026-07-26 lead: The operator selected the first concept because it is closest to the existing Machtblick member detail and requested conditional content tabs.
- 2026-07-26 audit: Current coverage is 171 candidates with all three tabs, 9 with biography and party, 3 with personal and party, 266 with party only, and 7 with no tabs. Availability must inspect meaningful content because every candidate has a profile row and every party has a programme object.
- 2026-07-26 tester: Verified all-data, two-tab, one-tab, and zero-tab candidates at berlin.machtblick.de on 390x844 and 1440x1000 viewports. Tab URLs, hidden panels, source access, overflow, framework overlay, and console checks pass.
- 2026-07-26 lead: TypeScript and the complete 527-page production prerender build pass.
- 2026-07-26 operator: Remove the redundant `Zur Person` and `Biografie` headings inside the already labeled biography tab.
- 2026-07-26 operator: Use the same Lora reading face as Machtblick speeches for personal and party programme prose.
- 2026-07-26 tester: Verified the live biography panel has no inner heading, both programme tabs render Lora at 16px and 1.45 line height, tab switching works, overflow is zero, and console output is clean.
