export const PROMPT_VERSION = 'speech-translation-en-v1'

export function buildPrompt(input) {
  return `Translate German Bundestag speech transcripts into clear, faithful English for a public transparency website.

Rules:
- Return strict JSON matching the schema.
- Return one translations item per input speech, in the same order, with the same speech_id.
- Translate only text_full.
- Preserve paragraph breaks and transcript structure.
- Preserve person names, party names, institution names, document numbers, law names, dates, counts, URLs, and Bundestag.
- Translate procedural address and parliamentary phrasing naturally.
- Preserve meaning, tone, hedging, quotations, interjections, applause notes, and interruptions.
- Do not summarize, shorten, expand, add facts, add caveats, or add commentary.

Input JSON:
${JSON.stringify(input, null, 2)}
`
}
