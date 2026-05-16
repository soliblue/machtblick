# Codex native config

## Goal

Make the Codex setup native instead of Claude-shaped: keep Claude agents as the source, emit supported Codex TOML agents, and check in project-level Codex config.

## Status

Done.

## Contracts

- Source agents stay in `.claude/agents`.
- Generated Codex agents live in `.codex/agents/*.toml`.
- Project Codex config lives in `.codex/config.toml`.
- `npm run agents:sync` regenerates Codex agents.

## Open Questions

None.

## Log

- lead: Started Codex native config cleanup.
- lead: Added project Codex config with project instruction fallback and subagent limits.
- lead: Changed `npm run agents:sync` to emit `.codex/agents/*.toml`.
- lead: Regenerated Codex agents from `.claude/agents`.
- lead: Updated lead and scribe agent source so every change requires a plan.
- lead: Validated generated TOML files and Codex prompt loading.
