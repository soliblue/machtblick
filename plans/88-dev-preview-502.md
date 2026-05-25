# Dev Preview 502

## Goal

Find why `https://dev.machtblick.de` is broken and restore the local dev preview if the fix is operational.

## Status

Restored. The public preview returns `200` for `/votes/` on May 25, 2026.

## Shared Contracts

- Keep machine-specific tunnel details out of checked-in docs.
- Treat `dev.machtblick.de` as the local checkout preview.
- Do not deploy.

## Open Questions

- None.

## Log

- Lead, May 25, 2026: Created plan after observing HTTP `502` from `https://dev.machtblick.de` and no visible Vite process in `ps`.
- Lead, May 25, 2026: Confirmed the tunnel was healthy, but its local origin had no listener. The port that was listening belonged to another project.
- Lead, May 25, 2026: Started the Bundestag Vite dev server for this checkout and verified `https://dev.machtblick.de/votes/` returns `200`.
