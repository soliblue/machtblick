export const PROMPT_VERSION = 'translation-en-v1'

export function buildPrompt(input) {
  return `Translate German Bundestag app content into clear, neutral English for a public transparency website.

Rules:
- Return strict JSON matching the schema.
- Preserve null values as null.
- Preserve party names, person names, document numbers, law names, institution names, dates, counts, and URLs.
- Do not add facts, opinions, caveats, markdown, or commentary.
- Keep titles concise and public-facing.
- Translate Bundestag terms naturally, but keep "Bundestag" as Bundestag.
- Translate "ja", "nein", "enthalten", "nicht abgegeben" only when they appear inside prose.
- Keep party_summaries in the same order and with the same party values.
- Return one translations item per input job, in the same order, with the same vote_id.

Input JSON:
${JSON.stringify(input, null, 2)}
`
}
