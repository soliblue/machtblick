# Vote Waffle Faction Dividers

## Goal

Tighten the vote detail faction breakdown so party labels take only the widest needed logo width, the waffle uses remaining width, and faction rows are separated by a subtle divider.

## Status

- Lead: in progress

## Shared Contracts

- Scope implementation to the vote detail waffle and its mock.
- Keep the total result donut unchanged.
- Keep `Fraktionslos` out of the faction breakdown.
- Use dynamic grid columns: logo column max-content, cell column fills the remaining space.
- Divider should be lighter and tighter than vote list row dividers.
- Do not touch unrelated dirty worktree changes.

## Open Questions

- None.

## Log

- 2026-05-23 lead: Created plan after user clarified the divider belongs between faction vote breakdown rows.
- 2026-05-23 lead: Changed `PartyWaffle` to `max-content minmax(0, 1fr)` columns and added a subtle `h-px bg-elevated` separator between faction rows.
