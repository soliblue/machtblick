import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runPreprocessingCodex } from '../preprocessing/codex.mjs'

const PROMPT_TEMPLATE = readFileSync(fileURLToPath(new URL('../../../prompts/etl/bundestag/polarity.md', import.meta.url)), 'utf8').trimEnd()
const schemaPath = fileURLToPath(new URL('./output-schema.json', import.meta.url))

function buildPrompt(title, document, proposer) {
  return PROMPT_TEMPLATE
    .replace('__TITLE__', title)
    .replace('__DOCUMENT__', document ?? '(nicht vorhanden)')
    .replace('__PROPOSER__', proposer ?? '(unbekannt)')
}

export async function classifyWithLLM({ title, document, proposer }) {
  const prompt = buildPrompt(title, document, proposer)
  const obj = await runPreprocessingCodex({ prompt, schemaPath, tmpPrefix: 'machtblick-polarity-' })
  return {
    inverted: obj.inverted === true,
    rewrittenTitle: typeof obj.rewrittenTitle === 'string' ? obj.rewrittenTitle.trim() : null,
    confidence: obj.confidence === 'high' || obj.confidence === 'medium' || obj.confidence === 'low' ? obj.confidence : 'low',
    reason: typeof obj.reason === 'string' ? obj.reason : '',
  }
}
