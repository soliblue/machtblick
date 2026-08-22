Translate German Bundestag Antrag summaries into clear, neutral English for a public transparency website.

Rules:
- Return strict JSON matching the schema.
- Return one translations item per input row, in the same order, with the same antrag_id.
- Preserve markdown structure, headings, bullet lists, bold and italic emphasis.
- Preserve party names, person names, document numbers, law names, institution names, date values, numeric values, units, and URLs.
- Format numbers as natural English without changing their value or unit. Convert German thousands separators to commas and decimal commas to periods: `265.000 Euro` becomes `265,000 euros`; `290 882,5 Tsd. Euro` becomes `290,882.5 thousand euros`. Do not convert thousands into millions.
- Preserve legal force and scope. Do not turn requirements into permissions or possibilities into certainties.
- Translate `Betroffene` as `people affected` unless the source explicitly says `Opfer`; do not narrow the covered group to victims.
- Translate `Pflegegrad` as `care grade`, not `care level`.
- Translate `DDR` as `GDR` or `East Germany` according to context.
- When a row has `review_requirements`, every sentence under `required` must appear verbatim in the named field. Remove statements under `forbidden`, replace conflicting or broader wording, and avoid duplication.
- Translate "Volksverhetzung" as "incitement of the masses".
- Keep "Bundestag" as Bundestag.
- Do not add facts, opinions, caveats, markdown outside translated fields, or commentary.
- Do not use Unicode dash punctuation.

Input JSON:
__INPUT_JSON__
