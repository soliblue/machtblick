# 146 Berlin 2026 candidate research

## Goal

Build a source-backed inventory for the 2026 Berlin Abgeordnetenhaus election before designing or implementing a voter guide. Cover every admitted party, list and constituency candidate, the information available for each person, party programmes, candidate-specific positions, and incumbent parliamentary evidence.

## Status

- official party admission and candidate publication sources: audited, candidate names not yet published centrally
- party programmes and candidate directories: initial 21-party submission inventory and 17-party admission audit done
- candidate evidence sources and reuse terms: audited
- normalized party and source inventory: done under `research/berlin-2026/`
- party-by-party candidate publication coverage: done under `research/berlin-2026/candidate-sources.csv`
- normalized candidate inventory: 231 party-published list profiles seeded, official publication pending
- coverage and gap report: initial report done
- BVV candidate expansion: separate second phase

## Scope

- First phase covers the Abgeordnetenhaus: 78 constituency contests plus Landeslisten and Bezirkslisten.
- BVV lists remain separately scoped because they add thousands of candidates and distinct district programmes.
- Party-published candidate names remain provisional until complaints are resolved and the official publication appears.
- All parties and candidates use the same source hierarchy and completeness fields.

## Source hierarchy

1. Election authorities and official admitted nominations
2. Parliament profiles, documents and disclosures
3. Official party, campaign and candidate sites
4. Candidate-authored questionnaires and public statements
5. Reputable third-party structured sources
6. News reporting, only for attributed context

## Candidate record

- official name and stable source identifier
- election type, constituency, district, party and list position
- admission status and source
- biography, profession and public contact links
- personal site and official social profiles
- candidate-specific positions and questionnaire answers
- party programme and district programme
- incumbent status, committees, questions, speeches, votes and disclosures
- source URL, publisher, publication date, retrieval date and reuse terms
- coverage flags for missing or conflicting information

## Open questions

- Which district decisions publish candidate names immediately after 22 July?
- Will the final admitted nominations be downloadable in a structured format or only PDFs?
- Which parties publish complete list and constituency candidate directories?
- How many candidates have substantive individual positions rather than only a party biography?
- Which evidence can legally be republished versus summarized and linked?

## Log

- 2026-07-22 lead: Started an all-party Abgeordnetenhaus source audit. Delegated official nominations, party programmes, and candidate evidence sources in parallel. Candidate data remains provisional during this week's admission decisions. The operator's physical brochures can be added later as candidate-provided primary sources and checked against online material.
- 2026-07-22 lead: Added a 21-party programme and directory inventory plus a reusable source inventory under `research/berlin-2026/`. The official source audit found no central candidate-name publication yet. District committees meet today, Landeslisten are decided 24 July, complaints can run through 30 July, and final publication is legally due by 30 August. SPD, GRÜNE, FDP, Die Linke, Volt and Tierschutzpartei currently have the strongest candidate navigation. Programme and candidate coverage remain fragmented for CDU, AfD, BSW and most small parties.
- 2026-07-22 lead: Added a candidate publication coverage table. Confirmed complete named sets include 78 SPD direct candidates, 50 GRÜNE list candidates and 78 direct candidates, 24 FDP list candidates, 18 Tierschutzpartei list candidates, 19 Volt list candidates and 78 direct candidates, and 8 ÖDP list candidates. These are party-published and remain provisional until admission is official.
- 2026-07-25 lead: The Landeswahlausschuss admitted 17 parties for second votes. Twelve have Landeslisten, SPD, CDU and Die Linke have Bezirkslisten in every district, and HEIMAT plus B* have lists in some districts. dieBasis, FREIE WÄHLER, MERA25 and PIRATEN were not admitted. The app now seeds 231 clearly sourced party-published list profiles while the consolidated official candidate publication remains pending.
- 2026-07-25 lead: Added `admissions.csv` for the full 21-party decision and refreshed programme and candidate coverage corrections found during implementation.
