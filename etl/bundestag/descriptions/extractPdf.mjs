import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { runPreprocessingCodex } from '../preprocessing/codex.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const TEXT_DIR = join(HERE, 'text')
const PDF_DIR = join(HERE, 'pdf')
const OCR_PROMPT = readFileSync(fileURLToPath(new URL('../../../prompts/etl/pdf-text-extraction.md', import.meta.url)), 'utf8').trimEnd()
mkdirSync(TEXT_DIR, { recursive: true })
mkdirSync(PDF_DIR, { recursive: true })
const enodiaCookies = new Map()

const MIN_CHARS = 200

const HEADER_PATTERNS = [
  /^Deutscher Bundestag.*Drucksache\s+\d+\/\d+\s*$/gim,
  /^\d+\.\s*Wahlperiode\b.*$/gim,
  /^Drucksache\s+\d+\/\d+\s*$/gim,
  /^\s*[-\u2013]\s*\d+\s*[-\u2013]\s*$/gim,
  /^\s*Seite\s+\d+(\s+von\s+\d+)?\s*$/gim,
]

function clean(raw) {
  let s = raw
  for (const re of HEADER_PATTERNS) s = s.replace(re, '')
  return s.replace(/\n{3,}/g, '\n\n').trim()
}

function safeId(drucksacheId) {
  return drucksacheId.replace('/', '-')
}

function txtPath(drucksacheId) {
  return join(TEXT_DIR, `${safeId(drucksacheId)}.txt`)
}

function pdfPath(drucksacheId) {
  return join(PDF_DIR, `${safeId(drucksacheId)}.pdf`)
}

async function download(url, dest) {
  let attempt = 0
  while (true) {
    const origin = new URL(url).origin
    const headers = enodiaCookies.has(origin) ? { cookie: enodiaCookies.get(origin) } : {}
    const res = await fetch(url, { headers })
    if (!res.ok && !res.headers.get('content-type')?.includes('text/html')) throw new Error(`HTTP ${res.status} for ${url}`)
    if (res.headers.get('content-type')?.includes('text/html')) {
      const text = await res.text()
      if (text.includes('Enodia Verification')) {
        await updateEnodiaCookie(origin, text)
        attempt++
        if (attempt > 3) throw new Error(`Enodia verification failed for ${url}`)
        continue
      }
      throw new Error(`HTTP ${res.status} for ${url}`)
    }
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
    return
  }
}

async function updateEnodiaCookie(origin, text) {
  const evl = text.match(/window\.chl = "([^"]+)"/)?.[1]
  if (!evl) throw new Error('Enodia challenge missing')
  const envelope = JSON.parse(Buffer.from(evl.split('.')[0], 'base64url').toString('utf8'))
  if (envelope.content.provider !== 'pow') throw new Error(`unsupported Enodia provider ${envelope.content.provider}`)
  const challenge = envelope.content.challenge
  let solution = 0
  while (!createHash('sha256').update(`${challenge}${solution}`).digest('hex').startsWith('0000')) solution++
  const verified = await fetch(`${origin}/.enodia/verify`, { method: 'POST', body: `${solution}-${evl}` })
  if (!verified.ok) throw new Error(`unexpected Enodia verify ${verified.status}`)
  enodiaCookies.set(origin, `enodia=${await verified.text()}`)
}

function runPdftotext(pdf) {
  try {
    return execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', pdf, '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  } catch {
    return ''
  }
}

async function runPdfjs(pdf) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const doc = await getDocument({ data: new Uint8Array(readFileSync(pdf)), disableWorker: true }).promise
  const pages = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map((item) => typeof item.str === 'string' ? item.str : '').join(' '))
  }
  return pages.join('\n\n')
}

async function runModelOcr(pdf) {
  const prompt = OCR_PROMPT.replace('__PDF_PATH__', pdf)
  return runPreprocessingCodex({ prompt, timeoutMs: 600000, tmpPrefix: 'machtblick-pdf-text-' })
}

export async function extractPdf(drucksacheId, pdfUrl) {
  const cached = txtPath(drucksacheId)
  if (existsSync(cached)) return readFileSync(cached, 'utf8')
  const pdf = pdfPath(drucksacheId)
  if (!existsSync(pdf)) await download(pdfUrl, pdf)
  let text = clean(runPdftotext(pdf))
  if (text.length < MIN_CHARS) text = clean(await runPdfjs(pdf))
  if (text.length < MIN_CHARS) text = clean(await runModelOcr(pdf))
  writeFileSync(cached, text)
  return text
}
