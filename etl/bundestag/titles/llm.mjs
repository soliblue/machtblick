import { fileURLToPath } from 'node:url'
import { buildPrompt } from './prompt.mjs'
import { runPreprocessingCodex } from '../preprocessing/codex.mjs'

const schemaPath = fileURLToPath(new URL('./output-schema.json', import.meta.url))

function cleanText(value) {
  return String(value ?? '')
    .replaceAll('\u2014', ', ')
    .replaceAll('\u2013', '-')
    .replaceAll(' -- ', ', ')
    .trim()
}

export async function cleanTitleWithLLM({ title, document, summary, drucksacheTitle, polarityTitle, isSammelubersicht = false }) {
  const prompt = buildPrompt({ title, document, summary, drucksacheTitle, polarityTitle, isSammelubersicht })
  const obj = await runPreprocessingCodex({ prompt, schemaPath, tmpPrefix: 'machtblick-title-' })
  const cleanTitle = typeof obj.clean_title === 'string' ? cleanText(obj.clean_title) : null
  return {
    clean_title: cleanTitle && cleanTitle.length > 0 ? cleanTitle : null,
    confidence: obj.confidence === 'high' || obj.confidence === 'medium' || obj.confidence === 'low' ? obj.confidence : 'low',
  }
}
