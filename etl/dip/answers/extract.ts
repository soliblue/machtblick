import { readdirSync, readFileSync, writeFileSync, openSync, fsyncSync, closeSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROOT, ensureRoot, pdfPath, txtPath, metaPath, hasPdf, hasTxt } from './cache.ts'

ensureRoot()

const MIN_CHARS = 100
const MIN_ALPHA_RATIO = 0.3
const OCR_PROMPT = readFileSync(fileURLToPath(new URL('../../../prompts/etl/pdf-text-extraction.md', import.meta.url)), 'utf8').trimEnd()

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

async function runPdfjs(id: number): Promise<string> {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const bytes = new Uint8Array(readFileSync(pdfPath(id)))
  const head = new TextDecoder().decode(bytes.slice(0, 5))
  if (head !== '%PDF-') return ''
  const doc = await getDocument({ data: bytes, verbosity: 0 }).promise
  const pages: string[] = []
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const text = await page.getTextContent()
    pages.push(text.items.map((item) => 'str' in item && typeof item.str === 'string' ? item.str : '').join(' '))
  }
  return pages.join('\n').replace(/\s+/g, ' ')
}

function runClaude(id: number, model: 'haiku' | 'sonnet'): { text: string; ok: boolean } {
  const prompt = OCR_PROMPT.replace('__PDF_PATH__', pdfPath(id))
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
  let source: 'pdfjs' | 'claude-haiku' | 'claude-sonnet' = 'pdfjs'
  text = await runPdfjs(id)
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
