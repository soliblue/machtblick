# Vote Title And Summary Repair

## Goal

Make vote title provenance explicit and reproducible, then repair local data so public vote pages can trust `clean_title` as the display title and `title` as the original upstream title.

Also close the summary coverage gaps found during the audit:

- visible votes without `clean_title`
- polarity rewrites stored in `votes.title`
- visible votes with source documents or speeches but missing vote summaries
- speech-rich handzeichen votes without party position summaries

No commit, push, or deploy in this work.

## Desired Invariants

- `votes.title` is the original upstream vote or protocol title.
- `votes.clean_title` is the reviewed public display title for every visible vote.
- UI uses `clean_title` for the main title.
- UI only shows the original `title` below when it differs from `clean_title`.
- polarity decisions never overwrite `votes.title`.
- data repairs are reproducible through checked-in ETL or DB scripts.

## Tasks

- [x] Repair title provenance scripts.
- [x] Backfill local title data.
- [x] Enforce title display invariant in app data paths.
- [x] Generate missing vote summaries where source material exists.
- [x] Generate or report missing party summaries for speech-rich handzeichen votes.
- [x] Add validation scripts or checks for the repaired invariants.
- [x] Run validation and record final counts.

## Open Questions

- Handzeichen party summaries were generated for speech-rich party rows using linked debate speeches.
- Nineteen visible votes still have no generated vote summary because no recognized source PDF could be selected. Validation treats only missing PDF-backed summaries as a failure.

## Log

- lead: Created plan and started implementation.
- lead: Backed up the local SQLite database before mutation.
- lead: Repaired title provenance from polarity decisions and official handzeichen extraction output.
- lead: Added namentlich source URL normalization to use official Bundestag detail pages.
- lead: Ran procedural cleanup and marked seven more visible routes as procedural, which removed them from prerendered public routes and sitemap output.
- lead: Generated two missing PDF-backed vote summaries and left nineteen no-PDF cases as reported gaps.
- lead: Generated five hundred sixteen missing speech-rich handzeichen party summaries.
- lead: Filled every visible vote `clean_title`, with low-confidence leftovers falling back to the polarity-neutral source title or original title.
- lead: Updated app read paths so visible vote titles require `clean_title` and fail during prerender if it is missing.
- lead: Validation passed with public_votes=272, missing_clean_title=0, polarity_title_overwrites=0, bad_namentlich_source_url=0, missing_handzeichen_title_sources=0, handzeichen_title_mismatches=0, missing_vote_summaries_with_pdf=0, missing_vote_summaries_total=19, missing_speech_rich_party_summaries=0, missing_speech_rich_party_summary_votes=0.
- lead: Bundestag app build passed after the app invariant changes.
- lead: Added a targeted translation mode for term-filtered missing public English fields.
- lead: Ran targeted English translations for the repaired term 21 vote and party summary fields. Dry run now reports translation_jobs=0.
