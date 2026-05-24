# Prompts folder

## Goal

Move the auto-refresh prompt to `prompts/auto-refresh.md` and collect ETL prompts into a skimmable `prompts/` tree.

## Status

Implemented.

## Contracts

- The scheduler reads `prompts/auto-refresh.md`.
- ETL scripts keep behavior unchanged.
- Prompt source files should be easy to skim without digging through worker code.
- Existing prompt builders may still inject dynamic data around these prompt bodies.

## Log

- Lead: Created plan before implementation.
- Lead: Moved the scheduled auto-refresh prompt to `prompts/auto-refresh.md`.
- Lead: Extracted ETL prompt bodies from Bundestag prompt builders and embedded worker prompts into `prompts/etl/`.
- Lead: Updated ETL scripts to read prompt Markdown files while keeping dynamic JSON and row data in code.
- Lead: Verified shell syntax, Python syntax, JavaScript syntax, TypeScript syntax for the touched TS worker, prompt builder imports, em dash scan, diff whitespace, and scheduler dry-run.
