import { readdirSync, readFileSync, writeFileSync, openSync, fsyncSync, closeSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { ROOT, ensureRoot, pdfPath, txtPath, metaPath, hasPdf, hasTxt } from './cache.ts'

ensureRoot()

const MIN_CHARS = 100
const MIN_ALPHA_RATIO = 0.3

const alphaRatio = (s: string) => {
  if (s.length === 0) return 0
  let a = 0
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 228 || c === 246 || c === 252 || c === 196 || c === 214 || c === 220 || c === 223) a++
  }
  return a / s.length
}

const isGibberish = (s: string) => s.length < MIN_CHARS || alphaRatio(s) < MIN_ALPHA_RATIO

function runPdftotext(id: number): string {
  return execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', pdfPath(id), '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
}

function runClaude(id: number, model: 'haiku' | 'sonnet'): { text: string; ok: boolean } {
  const prompt = `Extract the full plain text of this PDF (Drucksache from the German Bundestag). Output the text only, preserving paragraph breaks, no commentary, no markdown. PDF path: ${pdfPath(id)}`
  const out = execFileSync('claude', ['-p', prompt, '--model', model === 'haiku' ? 'claude-haiku-4-5' : 'claude-sonnet-4-5'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return { text: out.trim(), ok: out.trim().length >= MIN_CHARS }
}

const ids = readdirSync(ROOT)
  .filter((f) => f.endsWith('.pdf'))
  .map((f) => Number(f.replace('.pdf', '')))
  .filter((n) => Number.isFinite(n))

console.log(`extract: ${ids.length} cached PDFs`)
const todo = ids.filter((id) => hasPdf(id) && !hasTxt(id))
console.log(`extract: ${todo.length} to extract, ${ids.length - todo.length} already have text`)

let done = 0
const sources: Record<string, number> = {}

for (const id of todo) {
  let text = ''
  let source: 'pdftotext' | 'claude-haiku' | 'claude-sonnet' = 'pdftotext'
  text = runPdftotext(id)
  if (isGibberish(text)) {
    const haiku = runClaude(id, 'haiku')
    if (haiku.ok && !isGibberish(haiku.text)) {
      text = haiku.text
      source = 'claude-haiku'
    } else {
      const sonnet = runClaude(id, 'sonnet')
      text = sonnet.text
      source = 'claude-sonnet'
    }
  }
  const fd = openSync(txtPath(id), 'w')
  writeFileSync(fd, text)
  fsyncSync(fd)
  closeSync(fd)
  writeFileSync(metaPath(id), JSON.stringify({ source, extractedAt: new Date().toISOString(), chars: text.length }))
  sources[source] = (sources[source] ?? 0) + 1
  done++
  if (done % 50 === 0) console.log(`  extracted ${done}/${todo.length} (${Object.entries(sources).map(([k, v]) => `${k}=${v}`).join(' ')})`)
}

console.log(`extract: complete. done=${done} sources=${JSON.stringify(sources)}`)
