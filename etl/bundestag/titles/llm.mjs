import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildPrompt } from './prompt.mjs'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const schemaPath = fileURLToPath(new URL('./output-schema.json', import.meta.url))
const model = process.env.CODEX_MODEL ?? 'gpt-5.4-mini'
const provider = process.env.TITLE_PROVIDER ?? 'codex'

function runClaude(prompt, model) {
  return new Promise((resolve, reject) => {
    const c = spawn('claude', ['-p', '--model', model, '--output-format', 'json'], { stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    c.stdout.on('data', (d) => (stdout += d))
    c.stderr.on('data', (d) => (stderr += d))
    c.on('close', (code) => {
      if (code !== 0) return reject(new Error(`claude exit ${code}: ${stderr}`))
      resolve(stdout)
    })
    c.stdin.write(prompt)
    c.stdin.end()
  })
}

function runCodex(prompt) {
  const dir = mkdtempSync(join(tmpdir(), 'machtblick-title-'))
  const outPath = join(dir, 'out.json')
  return new Promise((resolve, reject) => {
    const c = spawn('codex', [
      '-a', 'never',
      'exec',
      '--model', model,
      '-c', 'model_reasoning_effort="low"',
      '--sandbox', 'read-only',
      '--ignore-rules',
      '--output-schema', schemaPath,
      '--output-last-message', outPath,
      '--cd', root,
      '--ephemeral',
      '-',
    ], { stdio: ['pipe', 'pipe', 'pipe'] })
    let stderr = ''
    c.stderr.on('data', (d) => (stderr += d))
    c.on('close', (code) => {
      if (code !== 0) {
        rmSync(dir, { recursive: true, force: true })
        reject(new Error(`codex exit ${code}: ${stderr}`))
        return
      }
      const text = readFileSync(outPath, 'utf8')
      rmSync(dir, { recursive: true, force: true })
      resolve(JSON.parse(text))
    })
    c.stdin.write(prompt)
    c.stdin.end()
  })
}

function extractJson(raw) {
  const env = JSON.parse(raw)
  const result = env.result ?? env
  const text = typeof result === 'string' ? result : JSON.stringify(result)
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`no JSON object in claude output: ${text.slice(0, 200)}`)
  return JSON.parse(match[0])
}

function cleanText(value) {
  return String(value ?? '')
    .replaceAll('\u2014', ', ')
    .replaceAll('\u2013', '-')
    .replaceAll(' -- ', ', ')
    .trim()
}

export async function cleanTitleWithLLM({ title, summary, drucksacheTitle, polarityTitle, isSammelubersicht = false }) {
  const prompt = buildPrompt({ title, summary, drucksacheTitle, polarityTitle, isSammelubersicht })
  const raw = provider === 'claude' ? await runClaude(prompt, 'sonnet') : await runCodex(prompt)
  const obj = provider === 'claude' ? extractJson(raw) : raw
  const cleanTitle = typeof obj.clean_title === 'string' ? cleanText(obj.clean_title) : null
  return {
    clean_title: cleanTitle && cleanTitle.length > 0 ? cleanTitle : null,
    confidence: obj.confidence === 'high' || obj.confidence === 'medium' || obj.confidence === 'low' ? obj.confidence : 'low',
  }
}
