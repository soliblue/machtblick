---
name: dip-rate-limit
description: DIP API returns HTML rate-limit pages (Enodia gateway) instead of JSON 429s when quota is exceeded — client must detect non-JSON and back off long
metadata:
  type: project
---

The Bundestag DIP API (`search.dip.bundestag.de/api/v1`) sits behind an Enodia gateway. When you exceed quota, the gateway returns an **HTML browser-challenge page** instead of a proper JSON 429. There is no Retry-After, no status code signal — just non-JSON in a 200 body.

**Why:** the first signatory backfill crashed twice around the 50k aktivitaet mark when retries exhausted, losing all in-memory progress. That incident drove the fetch/process split (see [[etl-fetch-process-split]] if written, and the principle baked into `.claude/agents/plumber.md`).

**How to apply:**
- `etl/dip/client.ts` `dipList` already handles this: detects non-`{` responses, retries up to 30× with exponential backoff capped at 5min. Don't lower these limits.
- Any new DIP endpoint must go through `dipList` (or `paginate`), never raw `fetch`.
- The fetch/process split (`npm run etl:dip:fetch` / `npm run etl:dip:process`) means a rate-limit-induced crash now loses at most the in-flight page, not the whole run — resume reads `_cursor.txt` per endpoint under `etl/dip/cache/<endpoint>/`.
- Full WP21 aktivitaet backfill is ~65k records (with `f.wahlperiode=21`), not the 1.75M global figure originally feared. Still substantial; expect rate-limit hits on long runs.
