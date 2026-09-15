# Berlin 2026 candidate research

Source audit for the 2026 Berlin Abgeordnetenhaus election, retrieved 2026-07-22.

## Current result

Berlin has not yet published the candidate names centrally. The 21 parties in `parties.csv` submitted a Landesliste or at least one Bezirksliste, but that official submission notice contains no candidates, constituencies, list positions or independent candidates.

District admission decisions take place on 2026-07-22. Landesliste decisions take place on 2026-07-24. Complaints and final numbering can continue through 2026-07-30. The consolidated official publication is legally due by 2026-08-30.

The official publication is expected to contain every admitted candidate's candidacy context, list position, name, birth year and place, learned and current occupation, residential postcode and submitted contact address. Full birth dates and full home addresses are not published.

## What exists now

- Roughly half of the submitting parties have a clearly published Berlin 2026 programme.
- SPD, GRÜNE, FDP, Die Linke, Volt and Tierschutzpartei already provide relatively complete candidate navigation.
- Candidate coverage for CDU, AfD, BSW and many smaller parties is fragmented or incomplete.
- All current Abgeordnetenhaus members have official parliament profiles.
- Abgeordnetenwatch has reusable CC0 data for the current parliament, but no Berlin 2026 election period yet.
- PARDOK provides daily official XML metadata for parliamentary documents, questions and protocols, but candidate names require entity matching.

`candidate-sources.csv` records which parties publish complete lists, complete direct-candidate sets, partial selections or nothing usable. Counts describe the named source only and do not imply official admission.

## Collection rules

- Official admitted nominations anchor identity and ballot position.
- Party claims, candidate claims and recorded parliamentary actions remain separate evidence types.
- Missing candidate information stays missing. Party positions are not silently assigned to individuals.
- Every extracted claim retains its source URL, publisher, date, retrieval date and political level.
- Public facts may be normalized. Copyrighted profile prose, programme text, journalism, photos and brochures are summarized and linked rather than mirrored.
- Residential addresses are not collected. Official contact addresses may be linked only when useful to voters.

## Candidate record

- official name
- candidacy type
- constituency and district
- party and list position
- admission status and official source
- biography and profession
- public contact and official profiles
- candidate-specific positions
- related party and district programmes
- incumbent status
- committees, questions, speeches, votes and disclosures
- coverage and conflict flags

## Brochures

Physical brochures are candidate-authored primary sources. Add the candidate, party, constituency, brochure title, publisher, visible date, where it was received, photographed pages and claim summaries. Verify factual claims against official or independent sources. Do not infer a full platform from an omitted topic.
