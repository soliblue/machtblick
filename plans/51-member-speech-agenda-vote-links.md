# 51 Member Speech Agenda Vote Links

## Goal

Show vote links on member speech rows when a speech shares the same date and agenda item as a vote, even when `speeches.vote_id` is empty.

## Scope

- Keep direct `speeches.vote_id` links first.
- Fall back to same-day `agenda_item` vote links in member detail data.
- Keep top-level speech search result links aligned with the same rule.
- Update both static and server member loaders.
- Verify Bachmann remains unlinked because her agenda items have no matching vote rows.

## Status

Completed.

## Log

### lead

- Confirmed the existing agenda fallback lives on vote detail and party-summary ETL only.
- Confirmed member speech data still joins only through `speeches.vote_id`.
- Updated member detail loaders to resolve a speech vote link through direct `speeches.vote_id` first, then same-day `agenda_item`.
- Updated speech search metadata and server speech search/list loaders to use the same fallback.
- Verified the fallback adds 965 speech vote links overall, moving resolved speech rows from 3,015 to 3,980.
- Verified Bachmann remains at 37 speeches and 0 vote links because her speech agenda items have no matching vote rows.
- Ran `npx tsc -p apps/bundestag/tsconfig.json --noEmit`.
