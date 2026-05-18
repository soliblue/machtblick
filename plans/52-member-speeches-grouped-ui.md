# 52 Member Speeches Grouped UI

## Goal

Keep the member tab named `Reden`, but count and present speeches as debate appearances instead of raw XML speaker fragments.

## Scope

- Group member speech rows by `date + agenda_item`.
- Keep search over every underlying contribution.
- Show short follow-ups inside their group, not as standalone top-level rows.
- Preserve existing vote links when direct or agenda fallback resolution finds one.
- Update the member stat and tab count to use the grouped count.

## Status

Completed.

## Log

### lead

- Started after confirming raw speech fragments make member pages look inflated and follow-ups lack context when shown alone.
- Added `agendaItem` to the shared speech result shape so member rows can group by date and agenda item.
- Added grouped member speech utilities and a grouped row component.
- Updated member stat and tab visibility to count grouped `Reden`, not raw speech fragments.
- Updated the member speeches tab search to filter grouped rows by every underlying contribution.
- Added lazy local exchange context from `speeches-meta.json` when a group is expanded.
- Removed the extra vertical border from expanded exchange context.
- Added protocol-derived agenda titles for unlinked speech groups so rows show the debate subject instead of only the TOP id.
- Verified Bachmann resolves to 14 grouped `Reden` from 37 contributions.
- Verified Bachmann's latest group now shows `Bundesweites Moratorium des Windindustrieausbaus`.
- Verified Brandner resolves to 57 grouped `Reden` from 163 contributions, with 12 linked groups.
- Ran `npx tsc -p apps/bundestag/tsconfig.json --noEmit`.
- Started Vite preview for manual testing on port 3001.
- Ran `npm run build -w @machtblick/bundestag`.
- Ran production visibility checks against generated HTML, discovery files, JSON alternates, share image dimensions, and Bachmann speech output.
- Moved member speech grouping and lazy context state into hooks so the view stays presentational.
- Reran `npx tsc -p apps/bundestag/tsconfig.json --noEmit`.
- Reran `npm run build -w @machtblick/bundestag`.
- Reran production visibility checks after the hook refactor.
