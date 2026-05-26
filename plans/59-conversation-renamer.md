# 59 Conversation Renamer

## Goal

Add a lightweight renamer specialist so Codex sessions can keep conversation names glanceable.

## Scope

- Add a renamer source agent under `.claude/agents`.
- Generate the matching `.codex/agents/renamer.toml`.
- Add the renamer to the project specialist lists.
- Document when lead should ask for a rename.

## Status

Completed.

## Shared Contracts

- Conversation names use one emoji plus up to four words.
- Names make clear what the conversation was really about, not only the first prompt.
- Lead should consider renaming after the first substantive user message, after about the fifth user message, and whenever the user asks if the title still fits.
- Renamer needs the target thread id from lead and must not rename its own spawned thread unless explicitly asked.

## Log

### lead

- Started after confirming `thread/name/set` can rename the current Codex conversation.
- Added `.claude/agents/renamer.md` with the app-server rename procedure and naming constraints.
- Tightened the rename command snippet to use shell variables for the target thread id and title.
- Added `renamer` to the Codex sync role map.
- Added renamer guidance to `AGENTS.md` and `CLAUDE.md`.
- Ran `npm run agents:sync`, which generated `.codex/agents/renamer.toml`.
- Verified generated agent presence and checked the changed guidance for em dashes.
- Updated the naming contract from two words to up to four words so titles can stay recognizable.
