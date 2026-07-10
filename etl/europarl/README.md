# etl/europarl

European Parliament (term 10, 2024-) ingest into the parliament-scoped `mp_*` tables (`parliament = 'eu'`).

## Sources

- **HowTheyVote.eu** bulk CSV dumps (ODbL) — the per-MEP roll-call ballot matrix, vote metadata, groups. `https://github.com/HowTheyVote/data/releases/latest`.
- **EP Open Data API** (`data.europarl.europa.eu`, JSON-LD) — MEP national party (the one field HowTheyVote lacks) and photo. EP legal notice, reuse with attribution.

MEP photos are EP copyright, reuse-with-attribution (`picture_license = '© European Union'`). Do not relicense.

## Run

```
npm run etl:europarl:fetch    # download the 5 CSVs to raw/ (gitignored)
npm run etl:europarl          # parse, enrich MEPs via EP API (cached), load mp_* tables
```

`etl:europarl` prints row counts and a German-MEP sanity count on completion. Idempotent: each run deletes and rewrites all `parliament='eu'` rows (never touches `be`/`by` or the Bundestag tables). EP API responses cache to `raw/ep-cache/` so re-runs skip the ~740 detail calls.

Target DB: `MACHTBLICK_DB` env or `db/machtblick.sqlite`.

## Cutoffs / scope

- **Term 10 only** (`votes.timestamp >= 2024-07-16`).
- **`is_main` votes only** — the final/substantive roll-call votes (~580) that carry a real title and ADOPTED/REJECTED result. Amendment sub-votes (`§ 1`, `point a`, article splits) are excluded: they have no standalone title and are meaningless without the parent bill. Widen by dropping the `is_main === 'True'` filter in `ingest.mjs` if the feed ever needs them (~5,300 term-10 votes, ~3.8M ballots).
- MEP roster = every MEP who cast a term-10 `is_main` ballot (742, includes mid-term replacements; ~96 live German seats -> 100 distinct German MEPs across the term).

## Mapping

- Ballot position: `FOR -> ja`, `AGAINST -> nein`, `ABSTENTION -> enthalten`, `DID_NOT_VOTE -> nicht_abgegeben`.
- Result: `ADOPTED -> angenommen`, `REJECTED -> abgelehnt`.
- EU groups -> `mp_parties.slug` (`groups.mjs`): EPP=evp, SD=sd, PFE=pfe, ECR=ekr, RENEW=renew, GREEN_EFA=gruene-efa, GUE_NGL=linke, ESN=esn, NI=ni, ID=id.
- `mp_members.party` = the MEP's current EU group slug; `mp_vote_party_summaries.party` = group **at vote time** (from the ballot's `group_code`).
