import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const PROMPT_VERSION = 'antrag-title-translation-en-v1'
const TEMPLATE = readFileSync(fileURLToPath(new URL('../../../prompts/etl/bundestag/antrag-title-translations.md', import.meta.url)), 'utf8').trimEnd()

export function buildPrompt(rows) {
  return TEMPLATE.replace('__INPUT_JSON__', JSON.stringify({ rows: rows.map((r) => ({ antrag_id: r.id, title: r.title, clean_title: r.clean_title })) }, null, 2)) + '\n'
}
