# 101 UI Quick Wins

## Goal
Implement the S-effort findings from plans/100-ui-audit.md. Two workstreams: frontend fixes (6 items) and ETL data fixes (2 items). Screenshots of the problems are in /tmp/ui-audit.

## Status
- frontend fixes: done
- ETL data fixes: done
- tester verification: done, all 8 items pass (F2 counts row + swatch filter, F3 no mobile header overlap, F9 badges + square hemicycle, F13 Laender caption, D7 First Last names + lastName sort, D8 Bundesland 20/20 populated, member detail loads). Only carry-over issue: hemicycle SSR/client float hydration warning on /parties/, noted in plan 102 tester log (BUG C)

## Scope

### Frontend (findings 2, 3, 9, 10, 11, 13 from plan 100)
- F2 /votes/$id: add a counts row (Ja/Nein/Enthaltung/Nicht abgegeben with numbers) that doubles as the color legend for donut and waffle
- F3 /members mobile: fix "Partei"/"Anwesenheit" header overlap at 390px (fixed narrow Partei column or drop its label on mobile)
- F9 /parties: add Regierung/Opposition Badge per party row; hemicycle marks as squares not circles
- F10 /votes/: hide "NAMENTLICH" tag when it matches the active filter; show party logo OR party-name badge, not both (also member header)
- F11 all list views: prepend Filter icon (size 14, opacity-l) to the shared FilterPills row
- F13 /motions/$id: caption above Bundesland badges ("Antrag der Länder", text-s uppercase)

### ETL / data (findings 7, 8 from plan 100)
- D7 normalize member name format (mix of "Klingbeil, Lars" and "Klaus Wiener" in same tables); fix in ETL/DB per "fix data, not symptoms"
- D8 Bundesland empty for ~95% of members: backfill from source data if available; if not feasible, report so frontend hides the column

## Contracts
- Design tokens: CLAUDE.md Design section; filter rows horizontally scroll, never wrap
- Schema: db/schema.ts (plumber owns); if D7/D8 change field semantics, note it here
- D7 semantics change: `members.name` is now canonically "First Last" for ALL rows (was mixed "Last, First" / "First Last"). Anything sorting members must use `last_name`, not `name`; `MemberListItem` now carries `lastName`, and both `listMembers` (server) and `useMemberListFilters` (name sort key) sort by it
- D8: `vote_members.state` and `members.list_state` are now 100% populated for term-21 members; frontend can keep the Bundesland column
- Dev server running on :5174 (pid 205995)

## Open questions
(none)

## Log
- lead: created plan from audit 100, dispatching frontend + plumber in parallel
- plumber: D7+D8 done. Root cause of both was the June namentlich importer (b2e847f) forking ~150 member identities via strict name matching and hardcoding vote_members.state=''. New idempotent scripts: db/merge-member-duplicates.ts (merged 155 dupes, 6769 ballots reassigned, purged 1104 unreferenced garbage member rows; WP21 members 757→637, zero remaining collisions), db/normalize-member-names.ts (550 names flipped to "First Last"), db/backfill-member-states.ts (127,756 ballot rows filled incl. WP20 dataset; WP21 ballot state coverage now 100%, sources: prior ballots → members.list_state → term mandate → Stammdaten XML → BTW25 Wahlkreis ranges). etl/bundestag/votes/import-namentlich.ts rewritten resolver (3-level relaxed name keys, mdb-id-first mandate matching, throws on ambiguity, writes real state); verified with a live run (630 mandates, 0 new forks). listMembers sort switched to last_name. Chain added as step 4 in prompts/auto-refresh.md; quirks documented in .claude/agents/plumber.md ("Member identity, name format, Bundesland"). DB backup at scratchpad machtblick-pre-d7d8.sqlite
- frontend: F2 F3 F9 F10 F11 F13 done, verified via curl against :5174. New files: views/votesList/FilterPillRow.tsx (Filter icon + non-wrapping scroll strip, now used by all 6 pill rows incl. VotingRecordTab/PartyVotesPanel which previously wrapped), views/voteDetail/VoteCountsRow.tsx (counts row doubling as donut/waffle legend, toggles same choice filter), lib/bundeslaender.ts. Touched: ResultTab, VoteDistributionDonut (exports VOTE_SEGMENTS), VotesList, VoteRow (type tag hidden when it equals active filter), PartyBadge (badge only, logo prefix removed; fixes votes list + member header doubling), MembersList (Partei header label hidden below sm), MembersList/RedenSearch/ProposalsTab pill rows, PartiesList PartyRow (Regierung success-tinted / Opposition neutral Badge via isGoverning in lib/parties.ts), Hemicycle (rect squares), AntragDetail (caption when initiativeFraktion is all Bundeslaender), i18n (government/opposition/laenderMotion). Pre-existing tsc error in lib/voteTitles.ts left untouched
