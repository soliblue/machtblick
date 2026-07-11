# Worktree Preview Infrastructure

## Status

Deferred. This document records the proposed setup only. No services, tunnels, DNS records, databases, deployment commands, or development servers have been changed.

## Goal

Allow multiple agents to run isolated Machtblick worktrees on the same VPS while keeping previews easy to open, avoiding repeated ETL rebuilds, and ensuring production web and TestFlight releases originate from `main`.

## Constraints

- The canonical Bundestag database currently lives on the VPS and is ignored by Git.
- A worktree must not mutate another worktree's database.
- Existing source caches are too large to duplicate casually.
- Production terms need stable hosts such as `20.machtblick.de` and `21.machtblick.de`.
- Production web builds need access to the VPS database.
- TestFlight builds may continue through GitHub Actions.
- Preview infrastructure must not interfere with production DNS or Cloudflare Pages projects.
- The current development server and tunnel must remain available during migration.

## Agreed Contracts

### Production

- `20.machtblick.de` and `21.machtblick.de` are explicit production DNS records connected to separate Cloudflare Pages projects.
- Exact production records take precedence over any preview wildcard record.
- Production web deployment runs on the VPS from the main checkout, using the appropriate local term database.
- The deployment command must verify that it is running from the main checkout, the branch is `main`, tracked changes are clean, and `HEAD` matches `origin/main`.
- TestFlight workflows accept `main` only.
- Feature worktrees are preview-only.

### Preview Data

- The main VPS database remains canonical for WP21 until term-aware storage is implemented.
- Each preview worktree receives a private SQLite backup at its expected ignored database path.
- Creating a preview database uses SQLite backup or `VACUUM INTO`, not a raw copy of a live writable database.
- Preview worktrees do not run ETL against the canonical database.
- Large immutable source caches may be shared read-only when ETL work needs them.
- WP20 and WP21 ultimately use separate canonical database files or immutable snapshots.

### Preview Hosts

- Preview names remain one level below the apex, such as `dev-search.machtblick.de`, so ordinary wildcard TLS coverage is sufficient.
- Unknown or inactive preview hosts must not expose an arbitrary local service.
- Starting and stopping one preview must not restart another preview's Vite process.

## Routing Options

### Option A: Shared Wildcard Tunnel

```text
*.machtblick.de
        -> one long-lived Cloudflare tunnel
        -> local host router
        -> worktree Vite port
```

The local router maintains the mapping from `dev-<slug>.machtblick.de` to a worktree port. Exact production DNS records bypass the wildcard. This gives automatic preview hostnames and one tunnel to operate, but introduces a small routing service or reverse proxy.

### Option B: Tunnel Per Worktree

```text
dev-<slug>.machtblick.de
        -> exact Cloudflare DNS route
        -> worktree-owned tunnel
        -> worktree Vite port
```

Each worktree can create and remove its own named tunnel because Cloudflare credentials are available. This removes the local host router, but every worktree must create an exact DNS route, own a tunnel process, and clean up both resources. A single wildcard DNS record cannot dynamically select different tunnel IDs.

### Option C: Fixed Preview Slots

```text
dev.machtblick.de   -> port 5174
dev-2.machtblick.de -> port 5175
dev-3.machtblick.de -> port 5176
```

Agents claim a preconfigured slot. This has the fewest moving parts and can be the first implementation even if dynamic previews are added later.

## Proposed Commands

```text
npm run preview:start -- <slug>
npm run preview:stop -- <slug>
npm run preview:list
npm run preview:refresh-db -- <slug>
npm run deploy:web:21
npm run deploy:web:20
```

`preview:start` should allocate a port or slot, create a private database backup, launch a user service from the requesting worktree, register its hostname, and print the URL. `preview:stop` should stop only that service and remove its routing state.

## Implementation Order

1. Normalize database selection where build and ETL code still hardcode `db/machtblick.sqlite`.
2. Add private preview database creation and refresh commands.
3. Add preview process lifecycle commands with locking around shared allocation state.
4. Choose shared wildcard routing, per-worktree tunnels, or fixed slots.
5. Add preview DNS and routing without changing the existing `dev.machtblick.de` path.
6. Start a second worktree preview and verify process, asset, and database isolation.
7. Add guarded VPS production deployment commands for WP21 and WP20.
8. Restrict TestFlight workflow entry points to `main`.
9. Verify that production hosts remain explicit and unaffected by preview routing.
10. Document machine-local operation outside checked-in project documentation where paths or credentials are host-specific.

## Verification

- Two worktrees can run concurrently and render different source changes.
- Each worktree reads its own SQLite file.
- A database write in one preview is absent from every other preview and the canonical database.
- Stopping one preview leaves the other previews online.
- An inactive preview hostname returns a failure response rather than another worktree.
- `20.machtblick.de` and `21.machtblick.de` never resolve through preview routing.
- Web deployment refuses to run from a feature worktree or non-main commit.
- TestFlight refuses a non-main workflow source.
- Existing `dev.machtblick.de` remains reachable throughout migration.

## Open Questions

- Whether a shared wildcard tunnel or independent worktree tunnels is operationally simpler after a small prototype.
- Whether fixed preview slots cover normal concurrency well enough to avoid dynamic routing.
- Whether `machtblick.de` remains the current-term canonical host or becomes a Bundestag-term picker.
- Where canonical WP20 and WP21 database snapshots should live on the VPS.
- Whether deployment credentials need OS-level isolation or repository rules and guarded scripts are sufficient.

## Agent Log

### Lead, 2026-07-11

- Inspected the current worktrees, VPS database usage, preview services, tunnel routing, storage footprint, and Git state.
- Confirmed that explicit production records can coexist with preview wildcard DNS.
- Recorded the user's observation that each worktree can own a Cloudflare tunnel.
- Kept shared wildcard routing, independent tunnels, and fixed slots as explicit alternatives.
- Deferred implementation so unrelated product work can continue.
