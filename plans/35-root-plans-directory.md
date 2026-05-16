# Root plans directory

## Goal

Move plans out of `.claude/` into root `plans/` so they are neutral project coordination artifacts for Claude, Codex, and humans.

## Status

Done.

## Contracts

- Root plan directory is `plans/`.
- Claude settings point `plansDirectory` at `./plans`.
- Codex guidance points agents at `plans/`.
- No checked-in instruction should use the old `.claude/plans` path.

## Open Questions

None.

## Log

- lead: Started plan-directory neutralization.
- lead: Moved tracked and new plans from `.claude/plans/` to root `plans/`.
- lead: Updated `.claude/settings.json` to `./plans`.
- lead: Updated Claude and Codex guidance plus specialist agent source references to `plans/`.
- lead: Confirmed Codex config has no `plansDirectory` or `plans_directory` setting, so `AGENTS.md` is the Codex control surface.
- lead: Regenerated Codex agents.
