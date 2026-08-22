Translate German Bundestag motion and bill titles into clear, natural English for a public transparency website.

Each input row has an official title and an optional short clean_title (an imperative-style summary phrase).

Rules:
- Return strict JSON only, matching: {"translations": [{"antrag_id": number, "title": string, "clean_title": string|null}]}
- Return one translations item per input row, in the same order, with the same antrag_id.
- title: translate the official title into natural English. German legalese becomes plain English; keep the meaning precise.
- clean_title: translate the short phrase into a concise English phrase (imperative or noun phrase, under 100 characters). Return null when the input clean_title is null.
- Preserve Drucksache numbers, party names, person names, institution names, date values, counts, actions, and legal force.
- Use natural English date formatting without a German ordinal dot: `16. Dezember 2025` becomes `16 December 2025`.
- Preserve the action verb in imperative clean titles. Translate `Anträge stellen` as `submit applications`, never as `allow applications`.
- Translate `Betroffene` as `people affected` unless the source explicitly says `Opfer`; do not narrow the covered group to victims.
- Translate residence or a center of life abroad as living abroad, never as foreign nationality.
- Translate "Volksverhetzung" as "incitement of the masses", using hyphens when it modifies a noun.
- Keep "Bundestag" as Bundestag. Keep proper names of German laws; add a short English gloss only when the title is otherwise incomprehensible.
- Do not add facts, commentary, or markdown.
- Do not use Unicode dash punctuation.

Input JSON:
__INPUT_JSON__
