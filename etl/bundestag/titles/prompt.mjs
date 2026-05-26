import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const PROMPT_VERSION = 4

const TEMPLATE = readFileSync(fileURLToPath(new URL('../../../prompts/etl/bundestag/titles.md', import.meta.url)), 'utf8').trimEnd()
const SAMMEL_TEMPLATE = readFileSync(fileURLToPath(new URL('../../../prompts/etl/bundestag/titles-petition-bundle.md', import.meta.url)), 'utf8').trimEnd()

export function buildPrompt({ title, summary, drucksacheTitle, polarityTitle, isSammelubersicht = false }) {
  const tpl = isSammelubersicht ? SAMMEL_TEMPLATE : TEMPLATE
  return tpl
    .replace('__TITLE__', title)
    .replace('__POLARITY_TITLE__', polarityTitle ?? '(nicht vorhanden)')
    .replace('__DRUCKSACHE_TITLE__', drucksacheTitle ?? '(nicht vorhanden)')
    .replace('__SUMMARY__', summary ?? '(nicht vorhanden)')
}
