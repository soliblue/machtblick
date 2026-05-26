# Vote Speech Summary Previews

## Goal

Make the party speech summaries on the vote detail speech tab clearly read as summary content, not filters.

## Scope

- Keep the existing `Reden zur Abstimmung` section for search, filters, and speech rows.
- Add a separate `Debatte im Überblick` section above the speech controls.
- Replace logo-only controls with full-width preview rows that open the existing summary modal.
- Add an AI-source note above the summary preview rows.
- Remove the party filter from the individual speeches section.
- Update the vote detail ASCII mock to make the layout contract durable.

## Status

Completed.

## Shared Contract

Party summary previews are navigation to summary content. They do not filter the speech list.

Rows show party identity, a short clamped preview, and a chevron affordance. The full summary remains in the modal.

## Open Questions

None.

## Log

- lead: Created plan after agreeing on the preview row approach with the operator.
- lead: Adjusted summary and speech lists so dividers appear only between adjacent rows.
- lead: Validation bundled the updated debate list with esbuild. Full TypeScript check is blocked by an existing `voteTitles.ts` error.
- lead: Renamed the summary section, added the AI-source note, and removed the individual speech party filter.
- lead: Switched the AI-source note to the existing surface notice style.
- lead: Kept party summary row identity logo-only when a party logo exists.
- lead: Reduced top padding on first summary and speech rows so section spacing does not double up.
