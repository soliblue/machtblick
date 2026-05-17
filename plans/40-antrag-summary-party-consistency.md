# 40 Antrag Summary Party Consistency

## Goal

Make Antrag detail pages behave like vote detail pages where the same concepts appear: normalized party badges, generated plain-language summaries, full-document source links only on the detail page, and clean member Antrag rows.

## Scope

- Normalize Antrag initiative parties before they reach `PartyBadge`.
- Remove PDF links from member detail Antrag rows.
- Add a Codex-based Antrag summary generation pipeline that mirrors the vote description pipeline.
- Generate missing German Antrag summaries where the source Drucksache PDF is available.
- Show generated Antrag summaries on Antrag detail pages.
- Keep summary counts and data integrity checks documented.

## Contracts

- `antrag_descriptions` stores German Antrag summaries.
- `antrag_description_translations` stores English overlays.
- Antrag detail reads generated summaries first, then falls back to DIP abstract or PDF.
- Member detail rows link only to vote or Antrag pages, not directly to PDFs.
- Party badges receive normalized party names from the server layer.

## Status

- Complete.

## Log

### lead

- Started from observed `334637` issue: Antrag initiative party was stored as `Fraktion BÜNDNIS 90/DIE GRÜNEN`, not normalized to `B90/Grüne`.
- Current coverage before this pass: 111 German summaries and 110 English translations across 833 term-21 Anträge.
- Normalized 573 stored Antrag initiative rows. `334637` now stores `B90/Grüne`.
- Added comma-separated party badge splitting so multi-party initiatives render as separate linked party badges when the parties are known.
- Removed direct PDF links from member detail Antrag rows. Rows link to the vote page when a vote exists, otherwise to the Antrag detail page.
- Added Codex-based Antrag summary generation and English translation runners, with root npm script entries.
- Generated German summaries for every term-21 Antrag with a Drucksache PDF: 822 of 833. The remaining 11 have no PDF source.
- English Antrag translations now cover 122 rows. Missing English translations fall back the same way vote pages do.
- Validated no remaining raw `Fraktion ...` or `Bundesministerium ...` initiative strings in `antraege`.
- Verified `334637` on `https://dev.machtblick.de/antraege/334637/`: normalized party badge, generated summary, detail Markdown, and detail-page PDF source link are present.
- Verification: `npx tsc -p apps/bundestag/tsconfig.json --noEmit`, `npm --workspace @machtblick/bundestag run build`, `git diff --check`, and changed-file dash scan all passed.
