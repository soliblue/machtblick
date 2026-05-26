import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const PROMPT_VERSION = 6

const promptPath = (name) => fileURLToPath(new URL(`../../../prompts/etl/bundestag/${name}.md`, import.meta.url))
const RULES = readFileSync(promptPath('descriptions-rules'), 'utf8').trimEnd()
const ANTRAG_TEMPLATE = readFileSync(promptPath('descriptions-antrag'), 'utf8').trimEnd()
const PETITIONEN_TEMPLATE = readFileSync(promptPath('descriptions-petitionen'), 'utf8').trimEnd()
const WAHLEINSPRUCH_TEMPLATE = readFileSync(promptPath('descriptions-wahleinspruch'), 'utf8').trimEnd()
const VERORDNUNG_TEMPLATE = readFileSync(promptPath('descriptions-verordnung'), 'utf8').trimEnd()
const UNTERRICHTUNG_TEMPLATE = readFileSync(promptPath('descriptions-unterrichtung'), 'utf8').trimEnd()

const TEMPLATES = {
  antrag: ANTRAG_TEMPLATE,
  petitionen: PETITIONEN_TEMPLATE,
  wahleinspruch: WAHLEINSPRUCH_TEMPLATE,
  verordnung: VERORDNUNG_TEMPLATE,
  unterrichtung: UNTERRICHTUNG_TEMPLATE,
}

export function buildPrompt(title, text, kind = 'antrag') {
  const truncated = text.length > 30000 ? text.slice(0, 30000) : text
  const template = TEMPLATES[kind] ?? TEMPLATES.antrag
  return template.replace('__TITLE__', title).replace('__TEXT__', truncated).replace('__RULES__', RULES)
}
