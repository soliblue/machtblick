# Remove agent memory

## Goal

Remove project memory from every specialist agent and retire the stale agent-memory ignore rule.

## Status

- [x] Remove `memory: project` from source agent definitions
- [x] Remove the agent-memory ignore rule
- [x] Regenerate Codex agent definitions

## Log

- Regenerated all six `.codex/agents` definitions and verified no active memory references remain.
- Removed four ignored agent-memory trees from the root, web app, iOS source, and DIP cache. Verified none remain.
