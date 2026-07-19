# 112: Deslop the meta layer

## Goal

Reduce agent and documentation slop to the load-bearing minimum. Operator-approved cuts: delete ceremony agents (renamer, archiver, launcher), fold scribe and visibility into docs, fold lead into CLAUDE.md and delete it, delete all 21 .mock.md files and demote mocks from source-of-truth to disposable design-time sketches, slim designer to a summonable role, clean agent memories (mostly already wiped), update AGENTS.md and codex tomls. Then commit and push.

## Kept agents

plumber (quirk log is load-bearing), backend, frontend, tester, deployer (absorbs visibility checklist), designer (slim, summoned for redesign rounds, works in throwaway sketches).

## Log

- lead 2026-07-19: plan created, executing directly (docs/meta work, no code risk; mocks have zero code references, verified).
- lead 2026-07-19: executed. Deleted 6 ceremony agents (renamer, archiver, launcher, scribe, visibility, lead), all 21 .mock.md files (zero code references, verified), and the entire .claude/agent-memory tree (10 dirs were already empty; plumber's two real memories were properly retired instead of kept: the dip_person_id drizzle drift was FIXED by adding the column to db/schema/members.ts, and the DIP rate-limit quirk moved into plumber.md's DIP section). Folded: scribe -> CLAUDE.md Commits section, visibility -> deployer.md pre-deploy checklist, lead -> CLAUDE.md Team preamble. designer.md rewritten to 15 lines (summonable, throwaway sketches, no standing mocks). CLAUDE.md + AGENTS.md team tables now 6 agents; mock source-of-truth rule replaced with design-time-scaffolding rule; dev bring-up commands moved from wiped agent memory into CLAUDE.md Dev URL section. Codex tomls resynced (6). Meta layer: 12 agents -> 6, 1370 -> ~950 agent-doc lines, 21 mocks -> 0, memory tree -> 0. tsc green, theme contract green.
