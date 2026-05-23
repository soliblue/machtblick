# Conversation archiver

## Goal

Add a separate `archiver` specialist for Codex conversation archive and unarchive actions.

## Status

Done.

## Contracts

- `renamer` stays focused on automatic conversation naming.
- `archiver` is manually invoked by lead or the user.
- `archiver` requires explicit target thread ids and archive intent.
- `archiver` must not archive the active root thread unless the user explicitly asks.
- Archive and unarchive actions use the Codex app-server API, not direct SQLite writes.

## Open Questions

- System-wide installation for all repos needs separate Codex discovery verification.

## Log

- lead: Started archiver specialist plan after verifying `thread/archive` on the Data Refresh conversation.
- lead: Added `.claude/agents/archiver.md` and generated `.codex/agents/archiver.toml`.
- lead: Added `archiver` to the specialist lists and Codex sync role map.
