# Codex AGENTS split

## Goal

Split Codex instructions from Claude instructions so Codex gets native root-session guidance in `AGENTS.md`, no generated `lead` subagent, and memory guidance that matches Codex behavior.

## Status

Done.

## Contracts

- `CLAUDE.md` remains Claude-facing project guidance.
- `AGENTS.md` becomes a real Codex-facing file, not a symlink.
- Codex root sessions use `AGENTS.md` for lead-like behavior.
- Generated Codex subagents exclude `lead`.
- Codex memories are treated as local recall only, not durable project truth.

## Open Questions

None.

## Log

- lead: Started Codex instruction split.
- lead: Replaced the `AGENTS.md` symlink with Codex-facing root instructions.
- lead: Removed the `CLAUDE.md` fallback from `.codex/config.toml`.
- lead: Updated `scripts/sync-codex-agents.mjs` so Codex generation skips `lead`.
- lead: Regenerated Codex agents and confirmed only spawned specialists remain.
- lead: Validated TOML parsing and confirmed Codex prompt loading uses `AGENTS.md` guidance.
