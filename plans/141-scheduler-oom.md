# Scheduler OOM

## Goal

Identify and prevent the local out-of-memory failure from the 2026-07-11 scheduled refresh.

## Status

Done.

## Contract

- Reconstruct the failing process tree and host memory pressure from retained evidence.
- Keep model selection separate from local process memory.
- Add the smallest durable scheduler or build safeguard.
- Verify configuration without triggering ETL, deploy, or a scheduled run.

## Open Questions

- Which process was selected by the OOM killer?
- Was pressure caused by prerender concurrency, retained command output, Wrangler upload, or unrelated app-slice processes?

## Log

- Lead: Started diagnosis from systemd, protocol, and host memory evidence.
- Lead: Confirmed the 7.6 GiB host had no swap and the job died during Wrangler upload while its Vite preview remained alive.
- Lead: Added an 8 GiB persistent swap file as a host memory-pressure buffer.
- Lead: Required scheduled runs to stop their preview and dev servers before deployment.
- Lead: Verified swap activation, scheduler prompt numbering, shell syntax, and the loaded systemd model settings without triggering a run.
