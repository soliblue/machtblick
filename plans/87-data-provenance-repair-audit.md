# 87 Data Provenance Repair Audit

## Goal

Find and repair data corrections that exist in the local database but are not reproducible from checked-in ETL, migrations, or normalization scripts.

## Known Suspects

- `votes.source_url` for term 21 namentliche votes is correct in the local DB, but the checked-in importer appears to write the XLSX URL. We need to confirm the gap, patch the importer, and add an idempotent repair for existing rows if needed.
- Some vote titles appear to have been overwritten in `votes.title` instead of being preserved as upstream title plus a reviewed `clean_title`. We need to identify affected rows, recover upstream titles where possible, and define where rewritten titles belong.
- Some votes have linked speeches but no generated party summaries. Example: `pp21-78-2-tag-der-stadtebauforderung-2026-motor-fur-starke-stadte-und-gemeinden` has linked speeches and vote summaries, but no `vote_party_summaries.position_summary` coverage.

## Review Strategy

1. Build a data mutation map.
   - Inventory every table and derived public column in `db/schema`.
   - Map each derived field to the scripts that write it by searching `etl/`, `db/`, migrations, and static build data.
   - Mark fields with no reproducible writer as suspect.

2. Audit known vote fields first.
   - `votes.source_url`, `bundestag_id`, `title`, `clean_title`, `result`, `inverted`, `summary_simplified`, `summary_detail`, `document`, `initiator`, `agenda_item`, `procedural`, `is_petition_bundle`.
   - `vote_documents`, `vote_document_roles`, `vote_description_decisions`, `vote_polarity_decisions`, `vote_party_summaries`.
   - For each field, record upstream source, writer script, repair script if any, and rerun behavior.

3. Compare current DB against low-cost upstream evidence first.
   - Do not start by rerunning the whole pipeline on SQLite snapshots.
   - For title drift, compare `votes.title` and `clean_title` against `vote_documents.title`, `vote_polarity_decisions.original_title`, `vote_polarity_decisions.rewritten_title`, Bundestag detail-page titles, DIP Drucksache metadata, and extracted PDF text where metadata is missing.
   - For `source_url`, compare `votes.bundestag_id` against the canonical Bundestag detail URL shape and against links scraped from the namentliche Abstimmungen list.
   - Use copied SQLite snapshots only after a suspected repair exists, to prove idempotency and rerun behavior.

4. Recover original vote titles.
   - Prefer official source data from Bundestag vote detail pages, `vote_documents.title`, DIP Drucksache metadata, protocol XML, and `vote_polarity_decisions.original_title`.
   - Use source PDF text extraction as a fallback when stored metadata is absent or ambiguous.
   - Restore upstream wording to `votes.title` where we can prove it.
   - Move human-friendly rewrites into `clean_title` or a more specific derived column.
   - Keep polarity rewrites tied to `vote_polarity_decisions` so inversion remains auditable.

5. Audit generated-summary coverage.
   - Identify votes with linked speeches through `vote_debate_groups` and `speech_debate_group_speeches` but no party-position text in `vote_party_summaries`.
   - Separate true skips from missing reruns: no speeches for a party, procedural rows, hammelsprung rows, extraction failure, prompt failure, or stale generated data.
   - Confirm whether `etl/bundestag/party-positions/run.mjs` should cover handzeichen votes with speeches, or whether the script currently only covers namentlich votes by design.
   - Add counts by vote type and by missing field: `position_summary`, `key_points`, `dissent_note`.

6. Make every repair repeatable.
   - Patch the source importer when the bug is in future ingestion.
   - Add an idempotent `db/normalize-*.ts` script or migration when existing rows need repair.
   - Link each repair from this plan and from the relevant agent notes when it teaches a reusable data rule.

## Deliverables

- A field provenance register in this plan or a follow-up plan if it grows too large.
- A short list of confirmed non-reproducible data fixes.
- Checked-in ETL or normalization patches for each confirmed issue.
- Before and after SQL counts for each repaired class.
- A final note in `AGENTS.md` or plumber notes if the audit discovers a new durable rule.

## Proposed Agent Split

- lead: owns the audit register, decisions, and integration.
- plumber: owns DB schema, ETL writers, SQL diffs, and repair scripts.
- backend: checks whether server/read code depends on corrected data shape.
- frontend: only involved if the audit reveals UI assumptions about derived fields.

## Status

- 2026-05-25 lead: Opened after identifying two likely non-reproducible data corrections: namentlich `source_url` detail links and vote title rewrites stored in `votes.title`.
- 2026-05-25 lead: Adjusted the audit strategy to start with low-cost upstream source comparison rather than full SQLite snapshot reruns.
- 2026-05-25 lead: Added speech-rich votes with missing party summaries as a third audit class after checking `pp21-78-2`.
