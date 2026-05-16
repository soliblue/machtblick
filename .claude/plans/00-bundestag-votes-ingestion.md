## Goal

Get every roll-call vote (Namentliche Abstimmung) from the current Bundestag into a queryable SQLite database in this repo, with the per-member vote, party totals, and source metadata preserved. Foundation for the `/votes` and `/votes/:id` views.

Port the logic (URL discovery, HTML parsing, totals sanity check), rewrite the shape (small files, view/logic split for ETL too).

## Status

| Workstream | Owner | State |
|---|---|---|
| Schema (`db/schema/*.ts`) | lead | done |
| Initial seed importer (seed.ts + per-vote JSONs) | plumber | done |
| Fetcher (list + detail + namensliste, with caching), for new votes only | plumber | todo |
| Parsers (teasers, detail, member votes, totals), for new votes only | plumber | todo |
| Writer (parsed records → SQLite) | plumber | todo |
| ETL entry point + cron-able script | plumber | todo |
| Sanity verification (totals match canvas counts) | plumber | todo |
| Hidden archive foundation BT16-BT20 | lead | done |

## Contracts

### SQLite at `db/machtblick.sqlite`

Tables (initial cut; plumber owns the final shape):

- `votes`: one row per roll-call vote (Bundestag id, date, title, subject, summary, result, totals, source URL)
- `vote_members`: one row per (vote, MP): party, state, choice (`ja` | `nein` | `enthalten` | `nicht_abgegeben`)
- `vote_party_summaries`: one row per (vote, party): member count, yes/no/abstain/absent
- `vote_documents`: one row per linked Drucksache (vote_id, label, title, url)
- `raw_vote_pages`: raw cached HTML keyed by Bundestag id and page type (detail / namensliste); never overwritten, lets us reparse without refetching

### Proposed folder split (etl/bundestag/)

```
etl/bundestag/
  votes/
    run.mjs              # entry point: discover → fetch → parse → write
    fetch/
      list.mjs           # discoverCurrentVotes + parseVoteTeasers
      detail.mjs         # detail page fetch
      namensliste.mjs    # roll-call HTML fetch
      cache.mjs          # fetchCached, trackSourceFetchTime
    parse/
      teasers.mjs        # parseVoteTeasers
      detail.mjs         # parseDetailInfo, extractSubject, extractContextParagraphs, ...
      members.mjs        # parseMemberVotes, parseCanvasTotals, countVotes, assertCounts
      documents.mjs      # extractDocumentLinks, buildDocumentUrl, normalizeDocumentTitle
      html.mjs           # readTag, readClass, cleanHtml, decodeEntities (shared HTML utils)
    write/
      sqlite.mjs         # open db, upsert vote + members + party summaries + documents
    SOURCE.md            # endpoints, quirks, why we cache, etc.
```

One concept per file, fetcher and parser separated (the view/logic principle applied to ETL). `run.mjs` is the only file that orchestrates; everything else is pure-ish and testable in isolation.

### Record shape (carried over from prior art)

```
Vote: { id, bundestagId, date, title, topic, summary, context[], subject,
        document, procedure[], result, totalMembers, yes, no, abstain, absent,
        sourceUrl, documentLinks[], partySummaries[] }
MemberVote: { id, name, party, state, vote }
```

## Open questions

| Q | Decision |
|---|---|
| Drizzle for SQLite, or hand-written SQL for the ETL pass? | Lead: Drizzle for schema + queries from the app; ETL can use the same Drizzle client |
| Cache directory, `.cache/bundestag/` in repo (gitignored) or `/tmp`? | Lead to decide before plumber starts |
| Include historic Wahlperioden, or only current (filter id `484422-484422` = current)? | Lead: current only for v1; historic later if needed |
| Do we also extract MP profiles in this pass, or only votes? | Lead: votes only this pass. MP profiles is plan `01` |

## Log

- **lead** (initial): Scaffolded repo (`package.json`, `tsconfig.json`, `.gitignore`, `drizzle.config.ts`), wrote schema split per table under `db/schema/`, created `db/client.ts`, installed deps (drizzle-orm, better-sqlite3, drizzle-kit, tsx), generated initial migration `db/migrations/0000_initial.sql`, applied it. SQLite DB created at `db/machtblick.sqlite` with all 5 tables. Confirmed via `sqlite_master`.
- **plumber** (importer): Built `etl/bundestag/votes/` (read/transform/write split, orchestrator `import.mjs`). Loader strips the `~/platform/data/freshness` import and `export type` blocks from seed.ts via brace-balanced parsing, dynamic-imports a temp .mjs. Member ids slugged from `<last>-<first>` (NFD diacritic strip, ß→ss); base-slug collisions across different states get a two-letter state suffix. Imported all 51 votes and their 51 per-vote member JSONs. Final row counts: votes=51, members=637, vote_members=32127, vote_documents=122, vote_party_summaries=306. Member-id collisions: 0 (apparent name variants like `Ahmetović`/`Ahmetovic` collapse via diacritic-stripping, so they resolve to the same member rather than colliding). Verifications: totals match (`yes+no+abstain+absent == totalMembers` on 3 random votes), `vote_members` count == `totalMembers` on 3 random votes, party-summary `yes` totals match grouped `vote_members` `choice='ja'` count on 1 random vote (every party row matched). See `etl/bundestag/votes/SOURCE.md`.
- **lead** (archive): Added term-aware archive storage for BT16-BT20 while keeping public reads scoped to BT21. `votes.term_id`, `member_affiliations.term_id`, and `member_mandates` let historic terms coexist with the current UI. Imported official Datenhandbuch roll-call registries for BT16-BT19, official BT20 XLSX ballots, and BT16-BT20 member mandates. B16-BT19 member ballots are intentionally not stored yet because the available CC0 RData package failed aggregate validation against Bundestag counts. Verified `npm run build --workspace @machtblick/bundestag`, static output count 5571 files, and no BT16-BT20 vote ids in generated public API data.
