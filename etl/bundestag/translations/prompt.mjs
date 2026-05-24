import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const PROMPT_VERSION = 'translation-en-v1'
const TEMPLATE = readFileSync(fileURLToPath(new URL('../../../prompts/etl/bundestag/translations.md', import.meta.url)), 'utf8').trimEnd()

export function buildPrompt(input) {
  return TEMPLATE.replace('__INPUT_JSON__', JSON.stringify(input, null, 2)) + '\n'
}
