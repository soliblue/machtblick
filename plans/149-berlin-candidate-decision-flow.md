# 149 Berlin candidate decision flow

## Goal

Turn the Berlin candidate directory into a low-click decision tool inspired by Machtblick vote and member surfaces.

## Status

- Bundestag reference audit: complete
- Berlin information hierarchy: complete
- district and constituency navigation: complete
- candidate list redesign: complete
- candidate detail redesign: complete
- programme comparison integration: complete
- desktop and mobile browser QA: complete
- public tunnel verification: complete

## Product contract

- A visitor can choose a Bezirk without opening a menu.
- A visitor can narrow to a Wahlkreis immediately after choosing a Bezirk.
- Candidate priorities, biography and party programme context appear in the list.
- Candidate detail is optional depth, not the first place useful information appears.
- Filters remain URL-backed and shareable.
- Missing personal information stays visibly missing.
- Party positions remain distinct from candidate-stated priorities.
- Existing Machtblick tokens and shared components remain the design source of truth.

## Log

- 2026-07-25 lead: Started the redesign after the operator found the structured archive too click-heavy. Using live and repository Machtblick vote/member surfaces as the accepted code-native reference, with no new generated images.
- 2026-07-25 research: Confirmed that Bezirk membership alone cannot answer who appears on an Erststimme ballot. The direct flow now uses exact Wahlkreis candidacies, while the full archive remains separate.
- 2026-07-25 frontend: Replaced the identity grid with a decision feed showing personal priorities, biography context, ballot facts, party programme context and evidence counts before opening a profile.
- 2026-07-25 QA: TypeScript and the 527-page production build pass. Playwright verified district and constituency filtering, topic switching, candidate detail, second-vote comparison, mobile navigation, zero horizontal overflow and zero console errors on berlin.machtblick.de.
