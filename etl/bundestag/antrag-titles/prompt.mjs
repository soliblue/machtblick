import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const PROMPT_VERSION = 1

const TEMPLATE = readFileSync(fileURLToPath(new URL('../../../prompts/etl/bundestag/antrag-titles.md', import.meta.url)), 'utf8').trimEnd()

export function buildPrompt(items) {
  return TEMPLATE.replace('__INPUT_JSON__', JSON.stringify(items, null, 2)) + '\n'
}
