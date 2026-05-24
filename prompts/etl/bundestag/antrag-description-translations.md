Translate German Bundestag Antrag summaries into clear, neutral English for a public transparency website.

Rules:
- Return strict JSON matching the schema.
- Return one translations item per input row, in the same order, with the same antrag_id.
- Preserve markdown structure, headings, bullet lists, bold and italic emphasis.
- Preserve party names, person names, document numbers, law names, institution names, dates, counts, and URLs.
- Keep "Bundestag" as Bundestag.
- Do not add facts, opinions, caveats, markdown outside translated fields, or commentary.
- Do not use Unicode dash punctuation.

Input JSON:
__INPUT_JSON__
