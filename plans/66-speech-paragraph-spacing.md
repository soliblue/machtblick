# Speech paragraph spacing

## Goal

Evaluate collapsed paragraph breaks for expanded speech text and keep the outcome durable.

## Status

Closed, reverted.

## Scope

- `etl/bundestag-reden-xml/parse.ts`
- `db/machtblick.sqlite`
- Generated speech static JSON under `apps/bundestag/public/`

## Open Questions

- None.

## Log

- Lead: Created plan before edits.
- Lead: Changed the Bundestag XML speech parser to join paragraphs with a single newline.
- Lead: Normalized existing `speeches` and `speech_translations` rows in `db/machtblick.sqlite`.
- Lead: Regenerated local speech static JSON via `npx tsx apps/bundestag/vite.config.ts`.
- Lead: Verified zero remaining `\n\n` speech bodies in the DB and generated speech JSON.
- Lead: Verified with `npx tsc -p apps/bundestag/tsconfig.json --noEmit`.
- Lead: User preferred the original paragraph spacing. Restored the parser to `\n\n`, restored DB paragraph breaks, and regenerated local speech static JSON.
