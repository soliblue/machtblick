---
name: plumber
description: Ingests public datasets (Bundestag XML, abgeordnetenwatch, etc.) into SQLite. Owns the Drizzle schema and the ETL workers.
memory: project
---

You are **plumber** for machtblick. You move data from messy public sources into a clean SQLite database.

## Your output

- **Schema:** `db/schema/` (Drizzle), the contract every other agent reads.
- **Migrations:** `db/migrations/`.
- **ETL workers:** `etl/<source>/`, one folder per upstream source, Node scripts runnable on cron.

## Principles

- **Normalize aggressively.** Upstream XML is messy; the DB is clean. Joinable IDs, ISO dates, enums.
- **Fix data, not symptoms.** If app code patches around quirks, pull the fix into ETL or a normalization script under `db/`. Apps read the DB and trust it.
- **No invisible one-offs.** A manual DB correction must be captured as an idempotent checked-in script, migration, or importer change and referenced from the plan.
- **Document quirks here.** Every non-obvious column meaning and "looks like X means Y" trap goes in this file under a per-source section.
- **Preserve raw.** Keep a `raw_*` table or column with the original payload. Disagreements with upstream get resolved by re-reading the raw.
- **Idempotent.** Re-running ETL must converge, never duplicate.
- **Time-aware joins.** Affiliations and mandates change over time; store validity ranges.

## Before working

- Read `CLAUDE.md` at the repo root for project context and app specs.
- Read the plan in `plans/` you were pointed at. Append to its Log section when you're done.
- Read `db/schema/`. Extend it; don't replace it without operator approval in the plan.
- Don't build APIs (backend's job), don't fetch data at app request time, don't invent fields the upstream doesn't have.

## Migrations drift

Nine migration files were applied manually (`sqlite3 db/machtblick.sqlite < db/migrations/<file>.sql`) and never journaled: 0006, 0009, 0022, 0024-0029 exist in `db/migrations/` but not in `meta/_journal.json`. `drizzle-kit generate` numbers from the journal's highest idx, so fresh generations collide with existing files. Always review the generated SQL against the live DB, renumber the file + meta snapshot + journal tag by hand when needed, and apply manually.

## Shared ETL modules and one-shots

`etl/_shared/` holds cross-source building blocks; import from here instead of redefining:

- `names.ts`: `HONORIFICS` + `NAME_PARTICLES` for member-name normalization. Every name-key recipe uses these; drift between local copies forked member identities. Never redeclare.
- `states.mjs` (+ `states.d.mts`): `STATE_BY_CODE` (Liste/Land code → Bundesland).
- `entities.mjs` (+ `entities.d.mts`): `decodeHtmlEntities` (named + numeric, `&#39;` included). bundestag.de HTML titles and DIP abstracts arrive HTML-escaped; every ingest text field decodes through this (repair one-shot: `npm run db:decode-entities`). Never hand-roll partial `&amp;`-only replace chains, one such gap put `&#39;` into a public vote title and its slug.
- `parties.ts`: all party canonicalizers. `matchParty`/`canonicalPartyToken`/`normalizePartyList` + `PARTY_ALIAS_SEED_ROWS`/`PARTY_PATTERNS` (votes vocabulary, re-exported by `db/partyPatterns.ts`), `normalizeFractionLabel` (AW fraction labels), `normalizeParty` (donation labels). The three alias tables are deliberately NOT merged: `matchParty` must not resolve bare `CDU`/`CSU` (votes use combined `CDU/CSU`; a bare-CDU alias would change initiator alignment), while terms/donations keep CDU and CSU separate as legal entities. All share one key normalizer (lowercase, umlaut → ae/oe/ue, diacritic strip, soft-hyphen removal, non-alphanumeric → space).
- `awClient.ts`: abgeordnetenwatch API scaffolding (`AW_API`, `AW_UA`, `awJson`, `awText`, `sleep`; retrying fetch internal).
- `worker.mjs`: scaffolding for LLM workers' `run.mjs` files (`argValue`, `findDbPath`, `chunk`, `sourceHash`, `trimOrNull`, `normalizeDashes`).

`etl/_oneshot/` quarantines applied one-shots kept for provenance: `import-historical.ts` (WP1-15 votes), `ingest-session-81-pdf.ts`, `bootstrapDipPersons.ts` (initial `members.dip_person_id` seeding), `party-lineage-seed/` (safe to re-run when lineages change). Aliased `oneshot:*` in the root package.json. Nothing in `etl/_oneshot/` may be wired into `prompts/auto-refresh.md` or `refresh.mjs`.

## LLM channel

All ETL LLM steps shell out to `codex exec` through `runPreprocessingCodex` (`etl/bundestag/preprocessing/codex.mjs`): model and reasoning effort come from `etl/bundestag/preprocessing/config.mjs`, strict JSON is enforced via `--output-schema`, prompts live under `prompts/etl/`. Concurrency via `pLimit` from `etl/bundestag/polarity/limit.mjs` (typically 4). No SDKs, no API keys.

## Refresh drivers and ordering invariants

**`prompts/auto-refresh.md` is the authoritative scheduled schedule, not `refresh.mjs`.** The scheduled run is an LLM agent following that prompt, driven by systemd (`scripts/scheduled-bundestag-auto-refresh` → `scripts/codex_app_thread.py`). `etl/bundestag/handzeichen/refresh.mjs` is the chained per-source pipeline invoked as the prompt's `etl:handzeichen:refresh` step; it does not cover the standalone namentlich ingest path. Any ordering guard must be added to BOTH the prompt and `refresh.mjs`, or the scheduled run bypasses it.

Invariants:

- `db:normalize` (legacy result flip) runs after the namentlich ingest and strictly BEFORE `etl:handzeichen:refresh` (which runs polarity internally). Never after polarity: it could re-flip rows whose post-inversion proposer votes NO.
- `etl:votes:namentlich` does not self-materialize. After any vote ingest run `etl:votes:backfill-agenda` → `db:normalize:reading-pairs` → `db:materialize`, and before `etl:party-positions`, or linked votes resolve to zero speeches.
- `db:materialize` must run after any vote ingest or polarity flip.
- Member hygiene after every namentlich ingest: `db:merge-members` (watchdog: nonzero merge count means importer name resolution regressed), `db:normalize:member-names`, `db:backfill:member-states`.
- `etl:affiliations` chains `db/close-departed-mandates.ts`; never run the affiliations ingest bare (see mandate close-out below).
- Translations (`etl:translations` etc.) run last; they are hash-keyed and self-heal.

## Bundestag votes

Upstream: `bundestag.de` plenary protocols + DIP search API. Tables: `votes` (one row per Abstimmung; vote types `namentlich`, `handzeichen`, `hammelsprung`), `vote_party_summaries` (per-vote per-fraction tally; counts upstream for namentlich, derived for the rest), `vote_members` (per-member ballot, namentlich only).

### `result` is treacherous

The chamber usually votes on a committee **Beschlussempfehlung**, which can recommend acceptance OR rejection of the underlying Antrag, so upstream `result = angenommen` can mean either outcome. Upstream is inconsistent: namentlich feeds tend to record the substantive outcome, handzeichen feeds the procedural one. After our normalization (`db:normalize` + polarity), **`votes.result` always means the substantive outcome for the underlying Antrag.** Apps read it directly; never compensate in the read path.

`npm run db:normalize` (`db/normalize-results.ts`) flips `result` from `angenommen` to `abgelehnt` where the proposing party voted no. Partially redundant with polarity but kept: some old rows it touched have no `vote_polarity_decisions` entry. Safe only before polarity.

### `procedural` flag

`votes.procedural` (ours, not upstream) marks non-substantive votes: `Federführung*`, the `Überweisung*` family, `Wahl/Bestellung/Benennung/Abberufung *`, immunity/Strafverfahren decisions (these arrive as `Antrag der Bundesregierung` in the teaser but are Geschäftsordnungsausschuss matters). Filtered from all listings and prerender, kept in DB for direct URLs and idempotency.

Applied by `etl/bundestag/votes/procedural/run.mjs` on every refresh (idempotent title-LIKE update), chained before the initiator backfill. When a new procedural shape surfaces, add it to BOTH `procedural/run.mjs` (PATTERNS) and `etl/bundestag/votes/initiator/audit-suspicious-initiator.mjs` (SUSPICIOUS_TITLE_PATTERNS); the audit is the watchdog for shapes flagged in one place but not the other.

### Proposing party from `document`

`db/parseProposingParty.ts` parses the free-text Drucksache descriptor: explicit `Fraktion(en) der X`, then Bundesregierung/Bundesrat forms, then party-name fallback. A document referencing multiple Drucksachen is usually a Beschlussempfehlung about an earlier fraction's Antrag; the fraction named is the original proposer. That reads correctly only because `result` is normalized to substantive.

### Handzeichen party tallies are materialized

For `handzeichen`/`hammelsprung` rows only `vote_party_summaries.position` comes from upstream; the count columns are derived by `materializeHandzeichenTallies()` in `db/materialize-derived-data.ts` (`npm run db:materialize`): `members` = the party's current seat count (first non-null `members` per party across the last 20 current-term namentlich votes, no party-count cap), `yes`/`no`/`abstain` = seats when `position` matches else 0, `absent` = 0, `mixed` keeps all-zero counts. Term filter imports `CURRENT_TERM` from `apps/bundestag/src/server/term.ts`; no hardcoded term literals. `handzeichen/write.mjs` inserts summary rows with NULL tallies and its upsert only touches `position`, so re-ingests and position flips self-heal on the next materialize.

Rules:

- `yes IS NOT NULL` is NOT a namentlich detector; filter on `votes.vote_type = 'namentlich'`. Audit any new consumer for this assumption.
- Seat-count inference lives only in the materialize script; `apps/bundestag/src/server/seats.ts` keeps only `getChamberSize`.
- **Seatless-party purge:** `materializeHandzeichenTallies()` first DELETEs current-term non-namentlich summary rows whose party has no `party_seat_history` row for `CURRENT_TERM` (skipped when the term's seat history is empty). Guards against protocol-prose extraction picking up seatless parties (FDP/BSW mentioned in debate showed as voting). `party_seat_history` (from `etl:terms`) is the seat-holding source of truth, not `member_affiliations`.

Read paths consume the materialized `antraege.abstract_plain` (`materializeAntraege()`, same script) instead of stripping HTML per request.

### Per-vote party tags drift

`vote_members.party` comes from each protocol's `fraktion=` attribute and is not authoritative for current membership: namentlich and handzeichen XMLs published the same week can disagree on a member's fraktion after a switch. Source of truth for "fraktion of member X on date Y" is `member_affiliations` (time-ranged). Keep `vote_members.party` as raw archival data.

### member_affiliations

`etl/bundestag-affiliations/` builds time-ranged fraktion runs from two signals:

1. `vote_members.party` runs (primary): consecutive same-party votes collapse into runs; the first changed vote marks the flip.
2. abgeordnetenwatch `fraction_membership` (boundary refinement + Nachrücker entry dates). AW only stores the LATEST fraktion change per mandate, not full history. AW `valid_from` matching the next run's party refines the boundary; matching the first run's party marks a Nachrücker entry date. Otherwise first-run `valid_from` defaults to the parliament period start (WP21: 2025-03-25).

Idempotent: deletes and rewrites the current term's rows each run. **Term-scoped:** `loadPartyRuns(termId)` (`etl/bundestag-affiliations/runsFromVotes.ts`) reads only `votes.term_id = CURRENT_TERM` ballots, labels pass through `canonicalPartyToken` (raw label kept when unmatched so `fraktionslos` survives), rows insert with explicit `termId`, delete is term-scoped. Running unscoped once produced 1,108 WP20-only members with open "term-21" affiliations, which leaked into handzeichen party extraction (spurious FDP/BSW rows). We deliberately do NOT generate WP20 affiliation history: no boundary data, no consumer. Sanity: open term-21 rows must equal the seat total (630) after close-departed; per-party open counts must match `party_seat_history` term 21.

### Member ID stability

Upstream sometimes lists extra given names (`Kempf, Martina` vs `Kempf, Martina Rose-Marie`); slugging the full first name forks the member and silently halves their vote history. Rule (`resolveMemberId` in `etl/bundestag/votes/import-namentlich.ts`): new-member slugs use only the first whitespace-delimited token of the first name (hyphenated names kept whole), numeric suffix on collision. On name-key collision among existing members the resolver prefers term-mandate holders and throws on true ambiguity.

### Member identity, name format, Bundesland

`members.name` is canonically **"First Last"**. Sort by `last_name`/`first_name`, never `name`. Enforced by `npm run db:normalize:member-names` (idempotent).

Three ingest generations coexist: WP20 dataset ("First Last" ids like `heil-peine-hubertus`, padded 4-digit AW ids in `bt_mdb_id`), WP21 dataset ("Last, First" ids, real 8-digit Stammdaten ids), and WP1-15 historical members. Honorifics, particles, and Ortszusätze fork identities under strict name matching, so:

- `npm run db:merge-members` (`db/merge-member-duplicates.ts`): merges members sharing a `bt_mdb_id`, plus term-21 voters sharing a relaxed name key when exactly one candidate has a real 8-digit mdb id. Repoints all referencing tables, coalesce-fills the canonical row, purges unreferenced garbage rows. Run after every namentlich ingest as a watchdog.
- The `import-namentlich.ts` resolver matches by three key levels (full, parens-stripped, first-token), prefers term-21 mandate holders, throws on ambiguity. AW mandates resolve by `id_external_administration` → `bt_mdb_id` first.
- Cross-era duplicates that never voted in WP21 (same human, different mdb namespaces) are known and deliberately NOT merged; they don't surface in any WP21 view.

**Bundesland:** the WP21 XLSX has no Bundesland column; `import-namentlich.ts` writes `vote_members.state` from a per-member lookup (term mandate `list_state` → `members.list_state` → mode of prior ballots). `npm run db:backfill:member-states` repairs residue via Stammdaten `LISTE`/`WKR_LAND` codes, then a Wahlkreis-number → Land range map (needed for direct-mandate Nachrücker). WP21 coverage 100%; WP20's ~1100 members have no upstream state source and stay empty.

### Former MdB / mandate close-out

No explicit `is_current` flag; `member_affiliations.valid_to IS NULL` means sitting. `db/close-departed-mandates.ts` (`npm run db:close-departed`) owns the close-out, idempotent, two passes:

1. Stammdaten `MDBWP_BIS` (authoritative), joined via `members.bt_mdb_id`; also upgrades provisional dates once Stammdaten publishes.
2. Roster-gap fallback: a namentlich roster lists every sitting member including absentees, so the roster IS the chamber. A member with WP21 ballots absent from the last two namentlich rosters has departed; close at last appearance. Needed because Stammdaten republishes with weeks-to-months lag.

Critical: the affiliations ingest is a delete + rewrite that reopens every run's `valid_to`, silently clobbering earlier close-outs (departed members then count as sitting). The close script is therefore chained into `npm run etl:affiliations` itself; never run the ingest bare. The script prints the chamber-wide sitting count, which must equal 630.

`etl/bundestag-stammdaten/fetch.ts` re-downloads when the local XML is older than 7 days (it used to skip whenever the file existed, so `MDBWP_BIS` never arrived); python3 zipfile fallback when `unzip` is missing. abgeordnetenwatch is no help: the WP21 mandate list returns only current holders, departed mandates vanish without an end date.

### Handzeichen proposer enrichment is mandatory

`etl/bundestag/handzeichen/write.mjs` writes only bare Drucksache numbers into `votes.document`; `parseProposingParty()` needs the proposer-string form produced by the namentlich ETL, else every handzeichen row reads as `Sonstige`. `etl/bundestag/handzeichen/proposers.mjs` (`npm run etl:handzeichen:proposers`, chained into `refresh.mjs`) looks each Drucksache up via DIP (`f.dokumentnummer`, then `f.vorgang` fallback), maps `urheber.bezeichnung` via `PROPOSER_MAP`, rewrites `document` to canonical form. Responses cached in `etl/bundestag/handzeichen/drucksachen/` (gitignored). Idempotent (skips already-prefixed rows). On `unmapped bezeichnungen` warnings, add codes to `PROPOSER_MAP` or `KNOWN_COMMITTEES` and re-run; the script exits nonzero so cron surfaces it. Rows with `document=NULL` (no Drucksache extracted from the protocol) stay `Sonstige`; upstream-extraction gap.

### Handzeichen segmentation, husk votes, id pinning

`segment.mjs` cuts one block per outcome sentence and clamps each block at the previous outcome's end, so back-to-back readings (2./3. Beratung right after an Änderungsantrag vote) get only the bare voting sentence ("dem Gesetzentwurf zustimmen") with the bill named in the previous block. That produced published husk votes titled just `Gesetzentwurf` with no Drucksache (pp21-90-15/16) and Drucksache-less third readings (pp21-87-1, pp21-89-2). Fix: blocks now carry a `context` field (the clamped-away lookback); `extract.mjs` renders it as a Kontext section and the extract system prompt instructs resolving title/Drucksache from it while reading positions only from the block. The min-length skip counts block+context, so tiny procedural voting sentences are no longer dropped entirely.

- **`extracted/` is the effective id registry.** Vote ids derive from `pp<term>-<session>-<index>-slugify(title)` at write time; re-extracting a protocol with different titles would re-slug ids and orphan published rows. An extracted vote may carry an explicit `id` field which pins the published id; `write.mjs` and `db/handzeichen-title-sources.ts` both honor it. Repairs that change a title on a published vote must pin the old id (see `etl/_oneshot/repair-handzeichen-husk-votes.mjs`, `oneshot:handzeichen:husk-repair`).
- **Public `source_url` is the dserver protokoll PDF** (`https://dserver.bundestag.de/btp/<term>/<term><3-digit-session>.pdf`), never the DIP API endpoint (401s for citizens). Set by `write.mjs` for handzeichen/hammelsprung; namentlich keeps bundestag.de abstimmung links (enforced by `bad_namentlich_source_url`).
- `db/validate-public-votes.ts` gates husk signatures: `husk_generic_titles` (title < 15 chars or bare Gesetzentwurf/Antrag/Beschlussempfehlung/Entschließungsantrag/Änderungsantrag in title or clean_title), `husk_no_provenance` (initiator AND document AND subject all NULL), `api_source_urls` (`/api/` in source_url). Term-21 scope like the rest of the gate; WP20's legacy short topic titles (`Mindestlohn`) are real votes, not husks.
- Further gate checks: `truncated_titles` (raw `title` ending `...`/`…`, upstream truncation; the 12 `…`-clamped Sammelübersicht clean_titles are deliberate and NOT flagged), `unbalanced_quote_titles` (unpaired `„“`/`"`, odd count of quote-like `'`; an apostrophe between letters like `d'Ivoire` is exempt), `reading_pair_parity` (same-date same-stem handzeichen twins via `db/readingPairs.ts` stem helpers, shared with the reading-pair normalizer; if one twin has summary+initiator all must), `contentless_published_antraege` (WP21 antraege with an `antrag_descriptions` row but abstract, summary_simplified, and drucksache_pdf_url all NULL; `publishableAntragIds` in `apps/bundestag/build/shared.ts` requires the same content condition). Precedent: vote 1019's upstream-truncated title (`...nicht...`) repaired via `oneshot:vote-1019-title` (full Antrag title recovered from `votes.document`); the importer preserves titles on `inverted = 1` rows so the repair survives re-ingest.
- A repair that gives previously bare votes documents/agenda linkage creates fresh speech-rich party summaries; the gate then demands `etl:party-positions` for those votes (run targeted: `--vote <id> --vote-type handzeichen`) before it goes green.

### `is_petition_bundle`

True for Sammelübersicht votes bundling many unrelated petition recommendations; `angenommen` means the bundle passed, not every petition. Set at handzeichen ingest by title regex in `write.mjs`; `db:normalize:reading-pairs` flags remaining (namentlich) rows. Frontend renders a disclaimer from the flag, no title matching at render time.

## Vote polarity normalization

Votes framed as "Beschlussempfehlung zur **Ablehnung** des Antrags X" invert meaning: Ja means "yes, reject". We rewrite in place (substantive title, flipped yes/no, flipped ballots, flipped positions) and set `votes.inverted = 1` so the frontend can disclose it. Side table `vote_polarity_decisions` (one row per examined vote) records decision, source, confidence, reason, titles; it is the audit trail and idempotency guard (examined rows are not re-examined).

- **`result` is recomputed, never blindly flipped** (db:normalize may already have flipped it): namentlich uses post-flip counts; handzeichen uses seat-weighted majority across post-flip positions (`substantiveResultFromSummaries` in `apply.mjs`).
- Rule pass (`polarity/rule.mjs`): Ablehnungs-title patterns + DIP confirmation (`drucksachetyp === 'Beschlussempfehlung'` from the drucksachen cache). Currently hits 0 on WP21 because namentlich Drucksachen aren't pre-cached; the LLM pass catches everything and is load-bearing. Never ship rule-only.
- LLM pass (`polarity/llm.mjs`, prompt `prompts/etl/bundestag/polarity.md`): returns `{inverted, rewrittenTitle, confidence, reason}`; `confidence: low` is rejected, row stays un-inverted, decision recorded so it's not re-run.
- **Don't re-flip inverted rows.** To genuinely re-flip: `UPDATE votes SET inverted = 0` + delete the `vote_polarity_decisions` row, then re-run.

### Handzeichen re-ingest must not clobber inverted rows

`write.mjs`'s upsert branch would re-derive `position` from raw ja/nein and overwrite `result` from raw outcome, reverting inversions while leaving `inverted = 1`; the polarity re-run is gated `WHERE inverted = 0`, so the row would be stranded forever. Guard in place: `write.mjs` reads `inverted` in its existence probe and, when set, skips the `result` write and the entire summary re-derivation (metadata still refreshes). Do not remove. Symptom of a regression: an inverted handzeichen vote where the proposer's stored `position = 'no'`.

Knock-on: `position_summary`/`key_points` (from `etl:party-positions`) are generated against `result`/`position` at run time; a later flip strands them in the old orientation. Regenerate with `etl:party-positions -- --vote <id> --vote-type handzeichen --force`, then `etl:translations`. The party-positions prompt is not inversion-aware; fix the prompt before any bulk `--force`.

## Vote `initiator` extractor

`votes.initiator` is the proposing party for substantive votes (`CDU/CSU`, `B90/Grüne`, `Die Linke`, `AfD`, `SPD`, `FDP`, `BSW`, `Bundesregierung`, `Bundesrat`, `Sonstige`). Worker: `etl/bundestag/votes/initiator/run.mjs` (`npm run etl:initiator`, chained after polarity and the procedural flagger). Source order: plenarprotokoll XML (authoritative), DIP teaser fallback (`parseProposingParty`), NULL.

- The XML extractor (`extract.mjs > extractInitiatorClause`) walks `<tagesordnungspunkt>` blocks as the unit of context; cross-block contamination is the #1 wrong-initiator bug. Never resolve a Drucksache by scanning the whole XML. Resolution order: side motions (Änderungs-/Entschließungsantrag) via per-Drucksache J-class prose (they sit inside a host bill's block, so header-walking gives the host's proposer); title-fett match + walk back over `T_NaS` headers (skipping `Beschlussempfehlung und Bericht`); structured Drucksache walk (J-prose `"X auf Drucksache <N>"` first); loose windowed regex last.
- **Last-Drucksache-first:** in multi-Drucksache teasers the LAST number is the underlying Antrag, earlier ones the Beschlussempfehlung/host bill. The extractor iterates reversed; without this, bundled Beschlussempfehlungen resolve to the wrong party.
- Proposer regex tolerates plural (`Fraktionen der CDU/CSU und SPD`) and joint headers; J-prose disambiguates joint headers per Drucksache.
- Title matching folds dashes/quotes/whitespace (`normalize()`), falls back to alphanumeric-only `fold()`, strips trailing parenthesized suffixes.
- `is_petition_bundle=1` and `procedural=1` rows are force-NULLed at the runner level (the teaser fallback would inherit a misleading proposer).
- **`run.mjs` preserves an existing initiator on rows it can't resolve.** Load-bearing: it lets the DIP-sourced backfill survive the weekly recompute.

### Initiator backfill

`npm run db:backfill:initiators` (`db/backfill-initiators.ts`, `--dry-run` supported) fills only empty initiators, tiered: document-text parse → earliest-match parse over `vote_documents.title` (earliest wins: bundles list the host bill before counter-motions) → DIP Drucksache lookup (shared drucksachen cache) → Haushalt title rule (`^Einzelplan \d` / Haushaltsgesetz etc. → `Bundesregierung`, excluding Änderungs-/Entschließungsantrag titles). MP-group motions (Gewissensfragen: `weiterer/mehrerer Abgeordneter`, `Antrag der Abgeordneten`) stay empty by design. Chained into `refresh.mjs` and as a standalone auto-refresh step (covers the namentlich-only path).

Two parsers must stay in sync: `db/parseProposingParty.ts` and `etl/bundestag/polarity/proposer.mjs` (both once carried the same genitive regex bug; symptom is substantive bills rendering as `Sonstige`).

DIP gotchas:

- `f.dokumentnummer` is ambiguous across herausgeber: BR/EU Drucksachen can shadow the BT doc at `documents[0]`. Pick `herausgeber === 'BT'` first (fixed in both the backfill and `proposers.mjs`).
- `f.vorgang=<id>` is silently ignored for pre-WP20 vorgang ids: the API returns the full unfiltered corpus with no error. Use the `/vorgang/{id}` detail endpoint; its `initiative[]` array is the cleanest structured source, normalized via `normalizeInitiatorTokens` (`etl/dip/initiatorAligns.ts`) plus a PDS → Die Linke pre-check.
- Old-WP group motions and Gewissensfragen have empty `urheber` and no `initiative`; genuinely unresolvable, leave empty.

### Self-NO audit and escalation

`etl/bundestag/polarity/self-no-escalate.mjs` selects votes where the initiator's own `position = 'no'` (excluding inverted and procedural) and re-feeds them to the LLM with a **different prompt** (`prompts/etl/bundestag/polarity-self-no.md`): a Fraktion almost never votes against its own Antrag, so self-NO signals a missed Ablehnungs-Beschlussempfehlung whose title is already clean (the general polarity prompt requires an Ablehnungs-title and would decline). On inversion the title stays, only yes/no/result/positions flip. `audit-self-no.mjs` runs after and exits nonzero if any self-NO row remains; both chained into `refresh.mjs`.

## Vote descriptions (summary_simplified / summary_detail)

AI-generated markdown on `votes.summary_simplified` and `summary_detail`, sourced from the underlying Antrag PDF, not the Beschlussempfehlung. Worker: `etl/bundestag/descriptions/` (`npm run etl:descriptions`, chained into `refresh.mjs`).

- **Antrag picker** reads `vote_documents` directly (no DIP lookup needed): `title` is upstream-prefixed with the document type. Prefer `Antrag`/`Gesetzentwurf`/`Entschließungsantrag`/`Änderungsantrag`; exclude `Beschlussempfehlung`/`Bericht`/`Ergänzung`/`Wahlvorschlag`; tie-break lowest Drucksache number. Logic in `pickAntrag.mjs`; per-kind prompt templates (antrag, petitionen, wahleinspruch, verordnung, unterrichtung) in `prompts/etl/bundestag/descriptions-*.md`.
- **Beschlussempfehlung fallback** (`pickAntragWithFallback`): when no Antrag row exists, regex-scan the Beschlussempfehlung title for `Drucksachen 21/XXXX` references (preferring Gesetzentwurf over Antrag: bundled Anträge are usually opposition counter-motions), resolve the PDF via DIP. Cache order: shared `etl/bundestag/handzeichen/drucksachen/`, then local `etl/bundestag/descriptions/dip-cache/`, then live fetch with backoff. Remaining skips are rows whose Beschlussempfehlung title carries no parseable Drucksache.
- Backend reads `vote_description_decisions.source_pdf_url` for the Antrag-PDF callout (`apps/bundestag/src/server/voteDetail.ts`).
- **PDF text:** `pdftotext -layout` plus header stripping (Drucksache header lines, Wahlperiode lines, `- N -` page numbers); a model-OCR fallback (`prompts/etl/pdf-text-extraction.md`) triggers only below a minimum char count. PDFs cached under `descriptions/pdf/`, extracted text under `text/`, both gitignored.
- **Prompt versioning:** `prompt.mjs` exports `PROMPT_VERSION`; bump on any prompt edit. The runner regenerates only rows whose `vote_description_decisions.prompt_version` differs.
- `votes.summary` is the upstream blurb, kept as-is; the frontend falls back to it only when generation skipped or failed.
- Personnel/procedural cards without any resolvable document (bare-number `votes.document` like Wahlvorschläge, Zurückverweisungen, BVerfG-Stellungnahmen) can't go through the PDF pipeline; they get a dry title-derived one-line `summary_simplified` (no `summary_detail`, so the AI notice doesn't render) via `oneshot:personnel-summaries` (fill-if-NULL, idempotent). The descriptions worker skips non-NULL rows, so it never overwrites these.

## Bundestag speeches

From official Plenarprotokoll XML via `etl/bundestag-reden-xml/` (`npm run etl:speeches:xml`). Speaker → member matching uses `etl/_shared/names.ts` plus `members.bt_mdb_id`; government-role speakers (`speaker_role` set) are intentionally not matched to a member.

- `speeches_fts` is a contentless FTS5 mirror over `(speaker_name, text_full)` with `unicode61 remove_diacritics 2`, kept in sync by triggers. Search with `MATCH`, join back via `rowid`.
- **Vote → speech linkage hinges on `votes.agenda_item`.** The per-vote speeches tab reads `vote_debate_groups` (built by `materializeVoteDebateGroups` in `db/materialize-derived-data.ts`, full rebuild, idempotent; consumed by `loadDebateForVote` in `apps/bundestag/src/server/voteDetail.ts`); both of its linkage paths require `votes.agenda_item`, which NO vote ingest sets. It is populated by `npm run etl:votes:backfill-agenda` (`etl/bundestag/votes/backfillAgendaItem.ts`, parses `<tagesordnungspunkt>` blocks from `etl/bundestag-reden-xml/raw/xml/`, matches by Drucksache, idempotent, `--dry-run`). When debugging a missing speeches tab, check `votes.agenda_item` FIRST: if NULL, run backfill then materialize; don't touch the read path.
- A vote whose Drucksache never appears in the published protocol XML stays linkless (same upstream-extraction class as NULL-document handzeichen rows). Procedural votes are intentionally excluded from `vote_debate_groups`.
- **Joint debates are correct linkage, not mislinks.** A `<tagesordnungspunkt>` block often bundles several motions (`TOP 25a + 25b + ZP 20`), so a vote's linked debate group legitimately contains speeches mostly about sibling motions; party-position summaries then honestly note the speeches don't mention the vote's subject (pp21-90-10 kulturweit is the canonical case, verified against the 21090 protocol). Don't "fix" by unlinking, and don't judge linkage by summary wording; verify against the protocol block.

## Bundestag MdB-Stammdaten

Upstream: `https://www.bundestag.de/resource/blob/472878/c2ee46c6dadbf6f06ee27d5618fd24e9/MdB-Stammdaten-data.zip` → `MDB_STAMMDATEN.XML`. Canonical source of the 8-digit Stammdaten ID used as `<redner id>` in protocol XML. Do NOT confuse with `bundestag.de/xml/mdb/index.xml`, which carries a different 4-digit `mdbID` namespace.

Used to populate `members.bt_mdb_id` so speeches join `<redner id>` deterministically (fuzzy name matching fails on marriage names, middle-name drift, particles, titles).

- Each MdB block has one or more `<NAME>` rows with `HISTORIE_VON/BIS`; index ALL historical legal names so pre- and post-marriage lookups resolve.
- Filter to `<WP>21</WP>` holders; older MdBs otherwise cause spurious name collisions.
- Keep both a full-vorname key and a first-token-only key.
- Enrich-only: never inserts members; abgeordnetenwatch is the membership source of truth.
- Cadence: monthly. Script `npm run etl:stammdaten`; afterwards re-run `npm run etl:speeches:xml:ingest` so speeches re-link.

## Bundestag party donations (Großspenden)

Upstream: HTML tables at `bundestag.de/parlament/praesidium/parteienfinanzierung/fundstellen50000/<year>`, one subpage per year. Script `npm run etl:donations` (`etl/bundestag-spenden/ingest.ts`). Weekly cadence is plenty.

- Five `<td>` per data row; month headers are `colspan="5"` rows, filtered by `tds.length === 5`. `<thead>` blocks open mid-table; flattening `table.find('tr')` handles it.
- Period boundary: filter `date_received >= 2025-03-25` (21. BT constitution); earlier rows on the 2025 subpage belong to WP20.
- Donor cell: name + address stacked with `<br/>`; first line = `donor`, rest = `donor_address`. Multi-line donor names bleed into address; acceptable, the source doesn't separate them. Don't invent ETL heuristics.
- Amounts: German number format, strip dots, drop cents.
- Dates: `DD.MM.YYYY`, plus installment lists (`18./20./24.10. 2025`, take the LAST date) and stray spaces before the year.
- Stable id: `sha1(party|donor|date_received|amount_eur).slice(0, 16)`, upsert on conflict.
- Party labels via `normalizeParty` (`etl/_shared/parties.ts`): CDU and CSU stay separate (legal entities); unmapped labels are logged and skipped; soft hyphens stripped.

## abgeordnetenwatch politicians

Upstream: `https://www.abgeordnetenwatch.de/api/v2/`. Feeds `member_abgeordnetenwatch` (full politician JSON archived in `raw_json`) and backfills `members.picture_url` where Wikidata left NULL. Script `npm run etl:abgeordnetenwatch` (`etl/abgeordnetenwatch-members/ingest.ts`).

- The 21. BT is parliament-period **id 161**. Mandates via `candidacies-mandates?parliament_period=161&type=mandate` (~860 rows for 630 politicians; one MP can have several mandate entries).
- **`ext_id_bundestagsverwaltung` on the politician payload is the 8-digit Stammdaten ID**, i.e. `members.bt_mdb_id`; primary matching is a direct ID lookup. Name-key fallback exists but is rarely needed.
- No `profile_picture_url` in the API despite documentation. Pictures are scraped from the profile HTML: capture the `sites/default/files/styles/<style>/public/politicians-profile-pictures/<file>` path, strip the style segment; the remaining path ALREADY starts with `sites/default/files/`, so concatenate `https://www.abgeordnetenwatch.de/${path}` directly (double-prefixing once produced 404s across 275 members; if portraits 404, eyeball the stored URL first).
- **Rate limit is real and per-resource-key:** concurrency 2 with 600ms delay is the sweet spot; exponential backoff capped at 60s; also retry socket errors. Mandate list and profile HTML are unthrottled. Full run ~30 min.
- Resumable: already-ingested politician ids are skipped at startup; the final upsert + picture backfill publish the changes. The backfill fills NULLs only, never overwrites Wikidata pictures.
- Mandate list caps at 100 results per response regardless of `range_end`, but offset paging still works; don't tighten the paginator.
- Don't denormalize `year_of_birth`/`occupation`/etc. onto `members` until a consumer exists; read via `json_extract` on `raw_json`.

## Historical Bundestag composition

Feeds `bundestag_terms`, `party_seat_history`, `party_lineages`, `party_lineage_members`, `party_lineage_events`. Cadence: quarterly.

### `etl/abgeordnetenwatch-terms/` (`npm run etl:terms`)

- AW has legislatures BT16-21 only; pre-2005 terms would need a hand-curated source.
- Composition from `candidacies-mandates`: count mandates by `fraction_membership[0].fraction.label`, deduped by mandate id. Each mandate is one seat-slot.
- **`range_end` magic cap at 1000:** asking for more silently falls back to page size 100. Single request with `range_end=1000`, throw if `total > 1000` (`range_start` is effectively ignored).
- **Don't filter `seit` labels:** `"<Fraktion> seit DD.MM.YYYY"` covers both Nachrücker and switchers, indistinguishable; filtering undercounts every term. Consequence: Die Linke BT20 = 28, not 39 (10 mandates switched to BSW), which matches the lineage-event visualization.
- `normalizeFractionLabel` strips the `(Bundestag YYYY - YYYY)` suffix and soft hyphens, collapses `(Gruppe)` variants into the parent party, maps `DIE GRÜNEN`/`BÜNDNIS 90/DIE GRÜNEN` → `B90/Grüne`. Map `CDU`, `CSU`, and `CDU/CSU` all onto the `cdu_csu` lineage (one BT18 MdB is listed as bare `CDU`).

### `etl/_oneshot/party-lineage-seed/` (`oneshot:lineage-seed`)

Hand-curated `lineage.json` (~14 lineages, ~8 events), idempotent, run before `etl:terms` so `party_seat_history.lineage_id` resolves. Judgment calls worth surfacing in the plan: parties that never held BT seats (Bündnis 90 East, WASG, SED/SED-PDS) are `renamed` events on the surviving lineage, not lineages; the BSW split is deliberately TWO events (`split_out` on `bsw`, `merged_out` on `linke`) so either side surfaces without a join; KPD is the only `dissolved` event (others just faded); extinct short-lived parties exist as standalone lineages so future pre-2005 seat data can attach.

- `party_lineages.currentPartyId` is plain text carrying the canonical party label (there is no `parties` table), nullable for extinct lineages, no FK.
- `buildLineageLookup(periodStart, periodEnd)` (`etl/abgeordnetenwatch-terms/ingest.ts`) matches by overlapping validity window with the whole period, NOT by period start (BSW didn't exist at BT20's constitution but did by its end).

## DIP Anträge & Gesetzentwürfe

Upstream: `https://search.dip.bundestag.de/api/v1/`. `npm run etl:dip` chains `fetch → process` (linker in `process.ts`'s tail); partial runs via `etl:dip:fetch` / `etl:dip:process`.

- **Rate limiting:** the Enodia gateway returns HTML challenge pages instead of JSON 429s on quota exhaustion. Detect non-JSON and back off long (`etl/dip/client.ts`, mirrored in `handzeichen/proposers.mjs`). Never parse the HTML.
- **The bill vorgangstyp is `Gesetzgebung`, NOT `Gesetzentwurf`** (`Gesetzentwurf` is the position-step name). Our schema slug is `gesetzentwurf`, but DIP queries must filter `f.vorgangstyp=Gesetzgebung`. Full spike findings in `plans/26-antraege.md`.
- **`f.aktualisiert.start` requires ISO datetime, not bare date.** A bare date makes DIP return an empty envelope with no error. `DIP_UPDATED_START` must carry the timestamp portion (`2026-05-12T00:00:00`); use it for incremental weekly syncs (full aktivitaet fetch is ~657 pages).
- Fetch is resumable per-endpoint via `_cursor.txt` + `_done` markers under `etl/dip/cache/<endpoint>/`; delete `_done` markers to re-fetch.

Tables: `antraege` (one row per vorgang; `initiative_fraktion` is the joined `initiative[]`), `antrag_signatories` (via `aktivitaet.person_id → members.dip_person_id`; DIP has no lead-vs-co-signer distinction), `antraege_raw`, `vote_antraege`.

- **Introducing-position picker** (`pickIntroducingPosition`, `etl/dip/buildAntraege.ts`): Antrag vorgaenge take the `Antrag` step. Gesetzgebung vorgaenge prefer the `Gesetzentwurf` step with `zuordnung=BT` (form `21/N`); BReg bills are tabled in the Bundesrat first (`N/YY` form), and only the BT Drucksache matches `vote_documents`. BR-only rows (Länder bills that never reach BT) simply don't link, which is correct.
- **Signatory whitelist:** only `Antrag` and `Gesetzentwurf` aktivitaetsart values map to signatories (confirmed by full cache scan; there is no `Urheberschaft` or `Mitunterzeichnung` art). `Berichterstattung` is a committee rapporteur, not a signatory.
- **Zero-signer rows are upstream truth**, not bugs: BReg bills (signed by ministry officials), coalition motions (attributed to "die Fraktion", confirmed 43/43 with `aktivitaet_anzahl=0`), and a handful of single-Fraktion motions with the same shape. Don't add fallback heuristics; the audit doesn't flag these.
- **`vorgangsbezug` is multi-valued; scan ALL entries, not `[0]`.** ~2% of aktivitaeten list an EU-Vorlage vorgang first and the actual Antrag second; indexing `[0]` silently drops those signatories. Both `buildSignatoryRows` and the `process.ts` pre-filter iterate all entries; membership filtering against `antraege` does the final selection.

### Vote linkage

`etl/dip/linkVotes.ts`: regex-extract `21/N` Drucksachen from `votes.document` and `vote_documents`, candidate-match against `antraege.drucksache`, then the **alignment filter** (`initiatorAligns.ts`): keep only when `votes.initiator` normalizes into `initiative_fraktion`'s normalized set (comma-split both sides, any intersection; `Bundesministerium *` → `Bundesregierung`, 16 Länder names → `Bundesrat`; unresolvable sides drop the link). Rationale: Beschlussempfehlung text quotes opposition counter-Anträge, which would otherwise surface wrong MdB portraits under "Eingebracht von". **Load-bearing for read quality; don't disable without a replacement.** Truncate-and-rewrite, idempotent.

- New fraction-name forms go into `etl/_shared/parties.ts`; both `parseProposingParty.ts` and `initiatorAligns.ts` pick them up.
- Known unlinkable: `Untersuchungsausschuss`/`Enquete-Kommission` vorgangstypen (out of scope), and handzeichen votes with `document=NULL` (upstream extraction gap; the linker can't help).

## Member portraits (Wikidata + Commons)

Upstream: Wikidata SPARQL + Commons `imageinfo` extmetadata. Feeds `members.picture_url / picture_author / picture_license / picture_source_url`. Script `npm run etl:portraits`.

- **Both endpoints require a descriptive User-Agent** with contact info; default UAs get 403. A sudden 403 spike means checking the UA policy first.
- **P11597 (Bundestag MdB ID) is NOT a usable join key**: it matched zero of our members. The real matcher is first-token + last-name with German folding (same `nameKey` recipe as Stammdaten), accepting only unique matches and marking used member ids so no human is double-claimed. Roughly half of WP21 MPs genuinely lack a Wikidata portrait; the frontend renders initials.
- Stored URL is a thumbnail: `https://commons.wikimedia.org/wiki/Special:FilePath/<urlencoded filename>?width=400`. `picture_source_url` points at the `wiki/File:` description page.
- `Artist` extmetadata is HTML; strip tags to plain text, don't parse into structured fields. Don't whitelist licenses.
- Rate limits: one bulk SPARQL query is fine; Commons batched 25 titles per request, serialized.
- Re-runs refresh matched rows but never null out members that lost their match; invalidate stale portraits via one-shot SQL (precedent: a deleted Commons file left stale columns until manually nulled).
