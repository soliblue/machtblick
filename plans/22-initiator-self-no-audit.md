# 22 — Audit & fix votes where initiator party voted NO on their own Antrag

## Goal

User heuristic: a Fraktion almost never votes against its own Antrag. Any vote where `votes.initiator` is a party and that same party's `vote_party_summaries.position = 'no'` is almost certainly either (a) wrong `initiator` extraction or (b) inverted polarity.

Find all such cases, root-cause each, fix in ETL (extractor or polarity), re-backfill. Document quirks in `.claude/agents/plumber.md`.

Trigger example: `pp21-53-3-ideologiefreien-innovativen-pflanzenschutz-...` — initiator=AfD but AfD voted NO and CDU/CSU + SPD + Grüne + Linke all voted YES. Document teaser literally says "Antrag der Bundesregierung". The XML title-first extractor likely grabbed an AfD-suffixed sibling agenda item in the same `<tagesordnungspunkt>`. `inverted=0`, `result=angenommen`, title is clean Antrag wording → this is *not* a missed-inversion case, it's wrong-initiator.

Two distinct bug shapes will surface in the audit; classify each hit:

| Shape | Signature | Fix location |
|---|---|---|
| Wrong initiator | `inverted=0`, result matches the coalition majority's position, title is a clean Antrag wording. Self-NO party is the actual opposer | `etl/bundestag/votes/initiator/extract.mjs` |
| Missed inversion | `inverted=0` but the original was a "Beschlussempfehlung … Ablehnung des Antrags der X". Initiator is correctly X; X voted NO on the rejection (i.e. supporting their own Antrag) but polarity ETL didn't flip it | `etl/bundestag/polarity/rule.mjs` or LLM prompt in `polarity/llm.mjs` |
| Already-flipped genuine self-NO | `inverted=1`. Rare; investigate individually | case-by-case |

## Status

| Step | Owner | State |
|---|---|---|
| 1. Run audit SQL: `initiator IN (party-set) AND EXISTS (vote_party_summaries WHERE party=initiator AND position='no')`. List every hit with vote id, initiator, document, party votes | plumber | todo |
| 2. For each hit, open the source plenarprotokoll XML and decide: wrong initiator vs inverted polarity vs genuinely-correct-but-rare | plumber | todo |
| 3. Categorize root causes (extractor bug shapes, polarity bug shapes) | plumber | todo |
| 4. Patch `etl/bundestag/votes/initiator/extract.mjs` and/or `etl/bundestag/polarity/*` for each category | plumber | todo |
| 5. Re-backfill initiator + polarity, re-run audit, confirm zero false positives (or document the genuine exceptions in plumber.md) | plumber | todo |
| 6. Make the audit a permanent ETL check: chain into `handzeichen/refresh.mjs` after initiator + polarity, exit nonzero or log loudly when new self-NOs appear | plumber | todo |

## Contracts

- Audit lives at `etl/bundestag/votes/initiator/audit-self-no.mjs` (next to existing `audit.mjs`).
- Closed party set for the check: `CDU/CSU`, `B90/Grüne`, `Die Linke`, `AfD`, `SPD`, `FDP`, `BSW`. `Bundesregierung` and `Bundesrat` aren't Fraktionen and don't have a `vote_party_summaries` row, so they're naturally excluded.
- "voted no" = `vote_party_summaries.position = 'no'` for the initiator party. Mixed/abstain don't count as self-no.

## Open questions

- Are there genuine cases? Strategic NO on a procedurally-required vote (e.g. a Fraktion submits a motion they want defeated for tactical reasons)? Almost never in Bundestag practice but possible. If we find any, document and whitelist.
- For inverted polarity, should the fix be in `etl/bundestag/polarity/` (one source of truth) or could it be a per-vote override? Default: fix the polarity rule.

## Log

(plumber appends here)

### 2026-05-14 — plumber

**Step 1 — initial audit**: 25 self-NO hits across the closed Fraktion set. 4 procedural (Federführung, Überweisung — initiator from teaser for non-Fraktion-proposed routing decisions), 18 substantive (`procedural=0, inverted=0`). 14 of 18 had `result=angenommen` + coalition-vs-initiator opposition pattern (classic missed-inversion signature); 2 had `result=abgelehnt` but still inverted polarity (pp21-74-10, pp21-37-7 — db:normalize-results already flipped `result` but yes/no/inverted/member-ballots weren't touched). The trigger example pp21-53-3 (user flagged as wrong-initiator) is actually missed-inversion: XML confirms AfD IS proposer; the vote was on a Beschlussempfehlung-zur-Ablehnung; coalition supported the recommendation (`Ja=reject`) and AfD opposed it.

**Step 2/3 — root-cause classification**:

| Category | Count | Fix |
|---|---|---|
| Wrong initiator (extractor) | 6 | `etl/bundestag/votes/initiator/extract.mjs` |
| Missed inversion (polarity) | 14 | `etl/bundestag/polarity/self-no-escalate.mjs` (new) |
| Procedural (should be NULL) | 4 | `etl/bundestag/votes/initiator/run.mjs` (skip `procedural=1`) |
| Petition bundle (should be NULL) | 2 | runner already skips `is_petition_bundle=1` |

Extractor bugs that surfaced:
- pp21-31-0 Änderungsantrag B90/Grüne — title-fett match doesn't find Änderungsantrag titles (they're not T_fett in protocol); Drucksache walk picked host bill's CDU/CSU proposer. Fix: dedicated `findSideMotionClause` that scans J-class prose for `<Änderungsantrag|Entschließungsantrag> der Fraktion … auf der Drucksache <N>`. JS `\b` word-boundary fails before `Ä` (ASCII-only) — use plain substring regex.
- pp21-25-0 Haushalt, pp21-51-1 Standortförderung, pp21-59-0/1 Tariftreue — title-fett didn't match due to quote/dash differences between DB-summarized title and XML T_fett. Fix: `normalize()` folds quote-family and dash-family; `fold()` is alphanumeric-only fallback.
- pp21-65-13/15/17 Wahlvorschlag AfD — joint-Fraktionen TOP-block header named CDU/CSU and AfD together; T_NaS walk picked first match. Fix: scan J-class running prose for per-Drucksache announcement first.
- pp21-40-19, pp21-71-0 — bundled Beschlussempfehlung with multiple Drucksachen; walked first-to-last and hit Gesetzentwurf proposer instead of underlying AfD-Antrag (Buchstabe b). Fix: reverse Drucksache iteration order (last = underlying Antrag).
- pp21-68-0 Kraftstoff — `Fraktionen` plural didn't match `\bFraktion\s+`. Fix: `Fraktion(?:en)?`.
- pp21-37-11/12 Sammelübersicht (petition bundles) — teaser-derived AfD even though Sammelübersichten aren't Fraktion-proposed. Fix: skip `is_petition_bundle=1` in runner.
- Procedural votes (pp21-10-0/1, pp21-21-1, pp21-77-0) — teaser carried a Fraktion name but vote is a chamber routing decision. Fix: skip `procedural=1` in runner.

**Step 4 — patches**:
- `etl/bundestag/votes/initiator/extract.mjs`: rewrote around `<tagesordnungspunkt>` blocks; added `findSideMotionClause`, J-class prose lookup, normalize/fold pair, Beschlussempfehlung-header skip, side-motion title routing.
- `etl/bundestag/votes/initiator/run.mjs`: skip `is_petition_bundle=1` and `procedural=1` → initiator=NULL.
- `etl/bundestag/polarity/self-no-escalate.mjs`: new. Selects self-NO rows, sends each through a dedicated LLM prompt (separate from polarity/llm.mjs) that accepts clean-title inputs and asks "was this an Ablehnungs-Beschlussempfehlung?". Uses `applyInversion` with `source='llm-self-no'` — title stays as-is, only yes/no/result/positions/member-ballots flip. ON CONFLICT in `vote_polarity_decisions` overwrites prior "no inversion" decisions.

**Step 5 — re-backfill + re-audit**:
- Initiator backfill: `xml=80 teaser=107 null=32 petitionBundles=62 procedurals=19 total=300`. All 9 plan-21 known-bad rows still correct.
- Self-no escalate: 14 candidates → 14 inverted on second LLM call (first attempt with general polarity prompt had 9/14 success rate; rewrote prompt to accept clean titles → 14/14 on substantive rows after split-prompt second pass against the residual 9).
- Final audit: 0 substantive self-NO hits.

**Step 6 — wired into refresh**:
- `etl/bundestag/handzeichen/refresh.mjs`: added `polarity/self-no-escalate.mjs` and `votes/initiator/audit-self-no.mjs` after the initiator backfill. Audit exits nonzero on any self-NO hit → cron surfaces drift.
- New audit script at `etl/bundestag/votes/initiator/audit-self-no.mjs`.
- Quirks documented in `.claude/agents/plumber.md` under a new "Vote `initiator` extractor — data notes" section.

**Open whitelist**: none. Every self-NO row in WP21 was either wrong-initiator or missed-inversion; no genuine strategic-NO cases found.

### 2026-05-14 (cont.) — Genehmigung/Immunität procedural shape

User flagged `pp21-74-14-genehmigung-zur-durchfuhrung-eines-strafverfahrens` — `initiator=AfD`, all five Fraktionen voted YES, so self-NO audit missed it. These are Immunitäts-Aufhebungs / Strafverfahrens-Genehmigungs votes: the Geschäftsordnungsausschuss recommends, chamber confirms. They carry `Antrag der Bundesregierung` in the teaser but aren't substantive BReg policy proposals; XML may mention a Fraktion (here AfD) because the MdB whose immunity is being affected is from that Fraktion → extractor picked it up. They should be `procedural=1, initiator=NULL`.

**Fix**:
- New `etl/bundestag/votes/procedural/run.mjs` — idempotent title-pattern flagger. Mirrors migration 0002 patterns and adds `Genehmigung zur/der Durchführung eines (Straf|Ermittlungs)verfahrens%`, `Aufhebung der Immunität%`, `Immunität %`. Re-runs over `procedural = 0` only. Initial run flagged 1 additional row (pp21-74-14). Initiator runner then nulled it.
- New `etl/bundestag/votes/initiator/audit-suspicious-initiator.mjs` — second audit channel. Lists substantive non-inverted votes whose initiator is a Fraktion AND whose title matches any known-procedural shape (Genehmigung/Immunität/Wahl/Bestellung/Benennung/Abberufung/Federführung/Überweisung/Ausschussüberweisung/Überweisungsvorschlag). Exits nonzero on hits. Acts as a watchdog: if the procedural flagger missed a row (or a new shape appears), this catches the symptom on Fraktion-attributed rows.
- `etl/bundestag/handzeichen/refresh.mjs`: chain order updated to `procedural flagger → initiator → self-no-escalate → audit-self-no → audit-suspicious-initiator`. Procedural flagger MUST run before initiator backfill so freshly-flagged rows get `initiator=NULL`.
- `.claude/agents/plumber.md`: extended the "What 'procedural' means" section with the Genehmigung/Immunität shape and the new flagger script; updated the order-of-operations diagram.

**Verified**:
- pp21-74-14: `procedural=1, initiator=NULL` ✓
- pp21-56-2 (BReg Gesetzentwurf mentioning "Strafverfahren"): still `procedural=0, initiator=Bundesregierung` — the new patterns match `Genehmigung … Strafverfahrens`, not arbitrary occurrences of `Strafverfahren`. No false positive.
- Both audits clean: `audit-self-no: 0 hit(s)`, `audit-suspicious-initiator: 0 hit(s)`.
