import { fileURLToPath } from 'node:url'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import Database from 'better-sqlite3'
import sharp from 'sharp'

const UA = 'machtblick-bundestag/0.1 (https://github.com/soliblue/machtblick; hello@machtblick.de)'
const WIDTH = 320
const DELAY_MS = 400
const MAX_ATTEMPTS = 5

const root = fileURLToPath(new URL('..', import.meta.url))
const outDir = `${root}public/members-photos`
mkdirSync(outDir, { recursive: true })

const db = new Database(`${root}../../db/machtblick.sqlite`, { readonly: true })
const rows = db.prepare(`
  SELECT m.id, m.picture_url, m.picture_author, m.picture_license, m.picture_source_url
  FROM members m
  WHERE m.picture_url LIKE '%commons.wikimedia.org%'
    AND EXISTS (SELECT 1 FROM member_affiliations a WHERE a.member_id = m.id AND a.term_id = 21)
`).all()
db.close()

const incomplete = rows.filter((r) => !r.picture_author || !r.picture_license || !r.picture_source_url)
const targets = rows.filter((r) => r.picture_author && r.picture_license && r.picture_source_url)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const thumbUrl = (url) => `${url.split('?')[0]}?width=${WIDTH}`
const existingFile = (id) => ['png', 'jpg'].map((ext) => `${id}.${ext}`).find((f) => existsSync(`${outDir}/${f}`) && statSync(`${outDir}/${f}`).size > 0)

async function download(row) {
  const cached = existingFile(row.id)
  if (cached) return { id: row.id, file: cached, status: 'cached' }
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const res = await fetch(thumbUrl(row.picture_url), { headers: { 'User-Agent': UA } }).catch(() => null)
    await sleep(DELAY_MS)
    if (res?.ok) {
      const ext = (res.headers.get('content-type') ?? '').includes('png') ? 'png' : 'jpg'
      writeFileSync(`${outDir}/${row.id}.${ext}`, Buffer.from(await res.arrayBuffer()))
      return { id: row.id, file: `${row.id}.${ext}`, status: 'downloaded' }
    }
    if (res && res.status !== 429 && res.status < 500) return { id: row.id, status: `failed ${res.status}` }
    await sleep(Math.max(Number(res?.headers.get('retry-after') ?? 0) * 1000, 2000 * 2 ** attempt))
  }
  return { id: row.id, status: 'failed retries' }
}

const started = Date.now()
const results = []
for (const row of targets) results.push(await download(row))

const byId = new Map(results.filter((r) => r.file).map((r) => [r.id, r.file]))
const manifest = {}
for (const row of targets.filter((r) => byId.has(r.id)).sort((a, b) => a.id.localeCompare(b.id))) {
  manifest[row.id] = {
    file: `/members-photos/${byId.get(row.id)}`,
    author: row.picture_author,
    license: row.picture_license,
    sourceUrl: row.picture_source_url,
  }
}
writeFileSync(`${outDir}/manifest.json`, JSON.stringify(manifest, null, 1))

async function optimize(file) {
  const path = `${outDir}/${file}`
  const input = readFileSync(path)
  const image = sharp(input).rotate().resize({ width: WIDTH, withoutEnlargement: true })
  const output = file.endsWith('.png')
    ? await image.png({ palette: true, quality: 80, compressionLevel: 9 }).toBuffer()
    : await image.jpeg({ quality: 80, mozjpeg: true }).toBuffer()
  if (output.length < input.length) writeFileSync(path, output)
  return { before: input.length, after: Math.min(output.length, input.length) }
}

let bytesBefore = 0
let bytesAfter = 0
for (const file of byId.values()) {
  const { before, after } = await optimize(file)
  bytesBefore += before
  bytesAfter += after
}

const counts = results.reduce((acc, r) => ((acc[r.status] = (acc[r.status] ?? 0) + 1), acc), {})
const failed = results.filter((r) => r.status.startsWith('failed'))
console.log(`member-photos: ${Object.keys(manifest).length} in manifest (${JSON.stringify(counts)}), ${incomplete.length} skipped for incomplete attribution, optimized ${(bytesBefore / 1e6).toFixed(1)}MB -> ${(bytesAfter / 1e6).toFixed(1)}MB, ${((Date.now() - started) / 1000).toFixed(1)}s -> public/members-photos`)
for (const f of failed) console.log(`  failed: ${f.id} (${f.status})`)
if (failed.length > targets.length * 0.05) process.exit(1)
