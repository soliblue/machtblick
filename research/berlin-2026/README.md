# Berlin 2026 election research

Source-backed coverage for the Berlin Abgeordnetenhaus election on 2026-09-20, last checked 2026-07-25.

## Official admission

Seventeen parties can compete for second votes. Twelve have admitted Landeslisten. SPD, CDU and Die Linke have Bezirkslisten in every district. HEIMAT and B* have Bezirkslisten in selected districts. The four submitted lists from dieBasis, FREIE WÄHLER, MERA25 and PIRATEN were not admitted.

Berlin has not yet published candidate names centrally. The consolidated official publication is due by 2026-08-30, so current candidate records remain party-published evidence.

Seven admitted parties still have no candidate names in the dataset: AfD, B*, CDU, DKP, HEIMAT, Die Urbane and Die PARTEI.

## Candidate coverage

`candidate-profiles.json` contains 456 unique people from 10 admitted parties and 646 candidacies. A person with both a list place and a direct constituency is counted once as a person and once for each candidacy.

| Party | Unique people | Landesliste | Bezirksliste | Wahlkreis | Candidacies |
|---|---:|---:|---:|---:|---:|
| BSW | 20 | 20 | 0 | 0 | 20 |
| FDP | 24 | 24 | 0 | 0 | 24 |
| GRÜNE | 90 | 50 | 0 | 78 | 128 |
| Die Linke | 98 | 0 | 85 | 78 | 163 |
| ÖDP | 8 | 8 | 0 | 0 | 8 |
| PdF | 7 | 7 | 0 | 0 | 7 |
| SGP | 1 | 1 | 0 | 0 | 1 |
| SPD | 111 | 0 | 102 | 78 | 180 |
| Tierschutzpartei | 18 | 18 | 0 | 0 | 18 |
| Volt | 79 | 19 | 0 | 78 | 97 |
| Total | 456 | 147 | 187 | 312 | 646 |

The dataset includes 180 biography summaries, 150 occupations, 174 profiles with 931 personal priorities, 57 explicit birth years, 93 profile URLs, 99 websites, 204 emails and 316 social links across 164 people.

`candidate-portraits.json` stores verified portraits separately from biographical research. Every portrait identifies one candidate and retains its original image URL, source page, publisher, provenance, retrieval date and any published author or license.

`candidate-sources.csv` records source coverage. `published_count` counts unique people within that row's candidacy scope. The table above provides deduplicated party totals and candidacy totals.

## Programme coverage

`programmes.json` covers all 17 admitted parties with 104 topics and 30 documents:

- 11 current 2026 programmes
- 3 general programmes
- 2 campaign statements
- 1 missing programme, PdF

## Stored candidate fields

- normalized slug, name and party
- one or more candidacies with type, list position, district, constituency and source URL
- primary source and optional candidate profile URL
- optional occupation, explicit birth year and biography summary
- candidate-stated priorities
- optional website, email and social links
- optional portrait with source, rights and provenance metadata
- retrieval date

## Collection rules

- Missing information stays null or empty.
- Party programme positions are not assigned to individual candidates.
- Candidate prose is summarized rather than copied.
- Candidate records and candidacies retain public source URLs.
- Portraits require an identifiable candidate and an original source page.
- Portraits come from clearly licensed media or official party and candidate sources.
- Public availability alone is not treated as a license.
- Generated, guessed, group and unverified preview images are rejected.
- Residential addresses are not collected.
