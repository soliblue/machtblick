# iOS members tab icon

## Goal

Use a narrower members tab symbol that remains clearly plural inside the iOS selected-tab background.

## Status

Implementation complete and ready for the macOS build gate.

## Scope

- Replace `person.3` with `person.2` for the members tab.
- Leave tab behavior, labels, and the web app unchanged.

## Verification

- Run static diff checks locally.
- Require the GitHub macOS iOS build to pass before dispatching TestFlight.

## Log

- User: selected `person.2` and requested commit, push, and deployment.
- Lead: replaced the symbol without changing tab behavior or accessibility labeling. `git diff --check` passed.
