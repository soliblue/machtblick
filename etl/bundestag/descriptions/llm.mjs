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

export async function generateDescriptions(title, antragText, kind = 'antrag') {
  const prompt = buildPrompt(title, antragText, kind)
  const obj = await runPreprocessingCodex({ prompt, schemaPath, tmpPrefix: 'machtblick-description-' })
  const simplified = typeof obj.summary_simplified === 'string' ? cleanText(obj.summary_simplified) : null
  const detail = typeof obj.summary_detail === 'string' ? cleanText(obj.summary_detail) : null
  if (!simplified || !detail) throw new Error(`incomplete LLM output: ${JSON.stringify(obj).slice(0, 200)}`)
  return { summarySimplified: simplified, summaryDetail: detail }
}
