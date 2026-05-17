# 44 CDU Antrag Signatories

## Goal

Audit and fix missing signatories for CDU/CSU Anträge, including any source-format variation that the DIP ingest currently misses.

## Scope

- Compare stored Antrag signatories by initiative party against raw DIP author data.
- Inspect CDU/CSU raw Antrag examples with zero stored signatories.
- Fix the ETL or an idempotent normalization script, depending on where the reliable source data lives.
- Reprocess local data and verify member Antrag rows improve without fabricating signatories.

## Contracts

- Prefer structured DIP author fields over PDF text parsing when available.
- Only infer a member when the raw source provides a person-level author with a resolvable DIP person id or member identity.
- Keep party-only initiatives separate from person signatories.

## Status

- Completed.

## Log

### lead

- Started audit after suspected missing CDU/CSU Antrag signatories.
- Counted 46 current Anträge whose `initiative_fraktion` includes CDU/CSU. They have zero stored member signatories.
- Compared those rows against raw DIP activity cache. None has `Antrag` or `Gesetzentwurf` person activities, which is the structured source used for member-level signatories.
- Inspected raw DIP position `urheber` for the CDU/CSU rows. They are faction, committee, Bundestag, or Bundesland authors, not individual members.
- Sampled PDFs 21/149, 21/563, 21/3029, 21/5321, and 21/5750. Their author lines are `Antrag/Gesetzentwurf der Fraktionen ...`, not `der Abgeordneten ...`.
- Conclusion: this is not a parser miss. CDU/CSU coalition Anträge are faction-authored in the source data, so there are no individual signatories to attach. Do not infer all faction members or debate speakers as signatories.
- Reopened to inspect full PDF tails for signature blocks, not only first-page author lines.
- Corrected finding: user was right. The same PDFs include final signature blocks such as `Jens Spahn, Alexander Hoffmann und Fraktion Dr. Matthias Miersch und Fraktion`, while DIP structured `Aktivität` rows do not expose those people as Antrag authors.
- Added a DIP ETL fallback that reads PDF tail signature blocks only for faction-authored Anträge with no structured signer rows.
- The fallback keeps the scope narrow: it only accepts signature groups ending in `und Fraktion`, and only maps names that resolve unambiguously to active term 21 members from one of the initiative parties.
- Reprocessed DIP data and recovered 160 Antrag signatory rows from PDF signature blocks.
- Validated CDU/CSU-related Anträge now have signatories for 46 of 46 rows, with 146 signer rows total.
- Checked samples: 21/6 maps to Alexander Dobrindt, Lars Klingbeil, Friedrich Merz; 21/149, 21/5321, and 21/5750 map to Jens Spahn, Alexander Hoffmann, Dr. Matthias Miersch; 21/3029 also maps Katharina Dröge and Britta Haßelmann.
- Verified the ETL run, app typecheck, PDF fallback typecheck, no disallowed dash characters in touched files, and a full Bundestag build with prerender.
