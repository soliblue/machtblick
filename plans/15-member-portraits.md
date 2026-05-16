# 15 — Member Portraits

## Goal

Show a portrait at the top of each Bundestag member's detail page. Source images from Wikidata P18 → Wikimedia Commons (CC-licensed, free). No backfill for MPs without a Wikidata image — we render a fallback (initials or silhouette) for the missing ~10%.

## Status

| Workstream | Owner | State |
|---|---|---|
| Schema additions to `members` | plumber | done |
| Wikidata → Commons ETL worker | plumber | done |
| Member detail header (portrait + attribution) | frontend | done |

Backend has nothing to do — `members` rows are already exposed; new columns ride along.

## Contracts

New columns on `db/schema/members.ts`:

| Column | Type | Notes |
|---|---|---|
| `pictureUrl` | `text` nullable | Direct Commons thumbnail URL (e.g. `https://commons.wikimedia.org/wiki/Special:FilePath/<file>?width=400`). Null for MPs without one |
| `pictureAuthor` | `text` nullable | Required by CC BY-SA attribution |
| `pictureLicense` | `text` nullable | e.g. `CC BY-SA 4.0` |
| `pictureSourceUrl` | `text` nullable | Link back to the Commons file page |

Matching strategy (plumber decides):
- Preferred: match on Wikidata property `P11597` (Bundestag MdB ID) → our `btMdbId`
- Fallback: name + party + active-in-Bundestag (`P39 = Q1939555`) where unambiguous

Render contract (frontend): at the top of `MemberDetailShell.tsx`, a square portrait (~120px) left of the name block. If `pictureUrl` is null, render initials in a `surface` tile with the same dimensions. Show `pictureAuthor` + license as small caption text linking to `pictureSourceUrl`.

## Open questions

None — license attribution is mandatory (CC BY-SA), and the no-backfill decision is settled.

## Log

- 2026-05-13 lead: plan created, dispatching plumber for schema + ETL; frontend follows once columns are populated.
- 2026-05-13 frontend: portrait added to top of `MemberDetailShell`. Extracted `MemberPortrait.tsx` (img or `bg-surface` initials tile, both 120x120, sharp corners). Caption below portrait (`text-s opacity-l`) renders only when `pictureUrl` is set, author links to Commons file page (`_blank`, `noreferrer`). Initials derived from `data.name` (first + last whitespace tokens) since the type carries the full name only. Header now `flex gap-l`: portrait left, name + party/state right; StatTiles + tabs unchanged below. Typecheck clean for changed files (one pre-existing error in `server/parties.ts` re. `cohesion` nullability, unrelated).
- 2026-05-13 plumber: schema columns added (`pictureUrl/Author/License/SourceUrl`, all nullable text), migration `0010_member_portraits.sql` generated and applied; drizzle-kit collided with existing 0008 slot + duplicated the 0009 agenda_item ALTER so I renamed + stripped that line by hand (same drift workaround as plan 06 documents). ETL at `etl/wikidata-portraits/ingest.ts`, runnable via `npm run etl:portraits`. First run: 636 WP21 members, **306 portraits set (48.1%)**. P11597 (Bundestag MdB ID on Wikidata) matched zero — that property is barely populated for WP21, all 306 came from name fallback (first-token + last-name with diacritic folding, only when unambiguous). Remaining 330 MPs have no Wikidata image; frontend should render initials fallback. `getMember` already does `db.select().from(members)` (full row) so new columns flow without a query change; added them to the `MemberDetail` return type. Source quirks documented in plumber.md under "Member portraits". Handing back to lead/frontend.
