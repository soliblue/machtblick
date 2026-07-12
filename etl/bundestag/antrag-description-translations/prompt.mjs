import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const PROMPT_VERSION = 'antrag-translation-en-v1'
const TEMPLATE = readFileSync(fileURLToPath(new URL('../../../prompts/etl/bundestag/antrag-description-translations.md', import.meta.url)), 'utf8').trimEnd()

export function buildPrompt(rows) {
  return TEMPLATE.replace('__INPUT_JSON__', JSON.stringify({ rows }, null, 2)) + '\n'
}
