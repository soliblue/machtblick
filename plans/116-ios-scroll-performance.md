# iOS scroll performance

## Goal

Improve iOS scrolling smoothness by removing avoidable full-screen work from scroll-offset updates while preserving the animated toolbar wordmark and existing feed behavior.

## Status

Implementation complete and ready for the macOS build gate.

## Scope

- Audit lazy containers across the primary votes, members, and parties screens.
- Isolate toolbar wordmark animation state from screen-level view state.
- Keep vote paging, filters, and visible content unchanged.

## Verification

- Review every primary scroll container for lazy row or grid construction where list size warrants it.
- Confirm scroll offset changes invalidate only the wordmark state consumer.
- Run repository formatting and static checks available on Linux.
- Use the macOS iOS build workflow before a release commit.

## Log

- User: reported that iOS scrolling does not feel smooth and asked whether lazy vertical stacks are used.
- Lead: confirmed the votes feed uses `LazyVStack` and the members screen uses `LazyVGrid`. The small parties list uses a regular stack.
- Lead: identified screen-owned scroll offset state as the primary code-level hotspot. Every scroll update invalidates the screen that filters vote or member data and owns complex row content.
- Lead: moved scroll offset into an observable reference consumed directly by the animated wordmark. Votes, members, and parties now update only that reference while scrolling instead of mutating screen-owned scalar state.
- Lead: `git diff --check` passed and all wordmark call sites use the isolated scroll model. Local iOS compilation and simulator profiling are unavailable because this Linux host has no Swift or Xcode toolchain; the synchronized Xcode source group will include the new file automatically.
- Lead: the requested release will push the iOS changes through the GitHub macOS build workflow, then dispatch the TestFlight workflow only after that build passes.
