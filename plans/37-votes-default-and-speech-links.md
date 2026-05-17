# Votes Default And Speech Links

## Goal

- Put Ausbildung into the member header metadata row, next to age and mandate.
- Remove the separate profile block with Beruf and external sources.
- Default the votes list to namentliche Abstimmungen.
- Explain why some namentliche Abstimmungen have no linked speeches.

## Status

Implemented.

## Decisions

- Education stays public but compact. It belongs in the header metadata row.
- Occupation, profile sources, and the separate profile block are out for now.
- The votes list should open focused on namentlich, because that is the most inspectable vote type.

## Speech Link Finding

Current speech ingestion stores one `vote_id` per speech and resolves by unique `(session_id, agenda_item)`.

This works when a debate agenda item maps to exactly one vote. It fails when a single debate agenda item contains several namentliche Abstimmungen. Example: `Tagesordnungspunkt 6` on 2026-04-24 has four named votes. The current resolver treats that as ambiguous and leaves speeches unlinked rather than choosing one wrong vote.

Current counts: 51 term-21 namentliche Abstimmungen, 30 with at least one linked speech, 21 without. Of the 21 missing links, 17 have speeches on the same agenda item but share that agenda item with multiple votes, and 4 have no agenda item speech match in the XML ingest.

Fixing that properly needs a speech-to-vote join table or another shared debate entity, because one speech can legitimately belong to several votes from the same agenda item.

## Log

- 2026-05-17 lead: plan opened after operator asked to simplify member profile facts, default the votes page to namentlich, and investigate missing speech links for named votes.
- 2026-05-17 lead: member header now shows Ausbildung as compact metadata. Separate profile facts, Beruf, and external profile sources are removed. German and English votes routes now default to `namentlich`.
