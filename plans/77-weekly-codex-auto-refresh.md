# Weekly Codex auto refresh

## Goal

Schedule a weekly fresh Codex app-server conversation named `🤖 YYYY-MM-DD Auto` that refreshes Bundestag data, delegates to specialist agents, adapts when upstream data changes, verifies the app, deploys when clean, and leaves an inspectable Codex thread plus run artifacts.

## Status

Implemented.

## Contracts

- The timer calls a small scheduler script, not Codex directly.
- The scheduler starts a new conversation per weekly run and never resumes an old auto-refresh thread.
- The conversation owns orchestration and can delegate to existing specialists.
- Deploy is allowed inside this scheduled auto-refresh conversation after visibility passes.
- Failure means stop, leave the conversation and result files inspectable, and do not deploy.
- Runtime logs and result files live under ignored `runs/_app-server/`.
- The user-level timer is installed from `scripts/install-systemd-user-units` and runs `scripts/scheduled-bundestag-auto-refresh`.
- The scheduler prompt lives in `prompts/auto-refresh.md`.
- The app-server helper is `scripts/codex_app_thread.py`.
- The refresh runbook lives directly in the scheduler prompt so future behavior changes happen in one operational file.

## Log

- Lead: Created plan before implementation.
- Lead: Updated the contract after user clarified each run must create a fresh thread.
- Lead: Added the app-server helper, weekly scheduler, preflight, prompt, systemd user units, installer, and ignored run directory.
- Lead: Verified shell syntax, Python syntax, em dash scan, diff whitespace, preflight execution, and scheduler dry-run.
- Lead: Inlined the refresh runbook into the scheduler prompt and removed runtime dependency on historical plan files.
- Lead: Changed runtime planning so no-op runs do not create plans, and existing local changes are validated and included instead of blocking by default.
