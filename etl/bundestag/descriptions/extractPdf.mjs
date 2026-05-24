import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { request } from 'node:https'

const HERE = dirname(fileURLToPath(import.meta.url))
const TEXT_DIR = join(HERE, 'text')
const PDF_DIR = join(HERE, 'pdf')
const OCR_PROMPT = readFileSync(fileURLToPath(new URL('../../../prompts/etl/pdf-text-extraction.md', import.meta.url)), 'utf8').trimEnd()
mkdirSync(TEXT_DIR, { recursive: true })
mkdirSync(PDF_DIR, { recursive: true })

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

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const chunks = []
    const doRequest = (target) => {
      const req = request(target, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return doRequest(res.headers.location)
        }
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${target}`))
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          writeFileSync(dest, Buffer.concat(chunks))
          resolve()
        })
        res.on('error', reject)
      })
      req.on('error', reject)
      req.end()
    }
    doRequest(url)
  })
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

function runClaudeOcr(pdf) {
  const prompt = OCR_PROMPT.replace('__PDF_PATH__', pdf)
  return execFileSync('claude', ['-p', prompt, '--model', 'claude-haiku-4-5'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim()
}

export async function extractPdf(drucksacheId, pdfUrl) {
  const cached = txtPath(drucksacheId)
  if (existsSync(cached)) return readFileSync(cached, 'utf8')
  const pdf = pdfPath(drucksacheId)
  if (!existsSync(pdf)) await download(pdfUrl, pdf)
  let text = clean(runPdftotext(pdf))
  if (text.length < MIN_CHARS) text = clean(await runPdfjs(pdf))
  if (text.length < MIN_CHARS) text = clean(runClaudeOcr(pdf))
  writeFileSync(cached, text)
  return text
}
