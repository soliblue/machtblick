import { fileURLToPath } from 'node:url'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import Database from 'better-sqlite3'
import sharp from 'sharp'
import { encodeMemberPhotoJpeg } from './member-photo-jpeg.mjs'

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
const existingFile = (id) => ['jpg', 'png'].map((ext) => `${id}.${ext}`).find((f) => existsSync(`${outDir}/${f}`) && statSync(`${outDir}/${f}`).size > 0)

async function download(row) {
  const cached = existingFile(row.id)
  if (cached) {
    const input = readFileSync(`${outDir}/${cached}`)
    if (cached.endsWith('.jpg') && (await sharp(input).metadata()).format === 'jpeg') {
      return { id: row.id, file: `${row.id}.jpg`, status: 'cached', before: input.length, after: input.length }
    }
    const output = await encodeMemberPhotoJpeg(input, WIDTH)
    writeFileSync(`${outDir}/${row.id}.jpg`, output)
    return { id: row.id, file: `${row.id}.jpg`, status: 'converted', before: input.length, after: output.length }
  }
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const res = await fetch(thumbUrl(row.picture_url), { headers: { 'User-Agent': UA } }).catch(() => null)
    await sleep(DELAY_MS)
    if (res?.ok) {
      const input = Buffer.from(await res.arrayBuffer())
      const output = await encodeMemberPhotoJpeg(input, WIDTH)
      writeFileSync(`${outDir}/${row.id}.jpg`, output)
      return { id: row.id, file: `${row.id}.jpg`, status: 'downloaded', before: input.length, after: output.length }
    }
    if (res && res.status !== 429 && res.status < 500) return { id: row.id, status: `failed ${res.status}` }
    await sleep(Math.max(Number(res?.headers.get('retry-after') ?? 0) * 1000, 2000 * 2 ** attempt))
  }
  return { id: row.id, status: 'failed retries' }
}

const started = Date.now()
const results = []
for (const row of targets) results.push(await download(row))

const completedIds = new Set(results.filter((r) => r.file).map((r) => r.id))
const legacyPngs = readdirSync(outDir).filter((file) => file.endsWith('.png'))
for (const file of legacyPngs) unlinkSync(`${outDir}/${file}`)
const manifest = {}
for (const row of targets.filter((r) => completedIds.has(r.id)).sort((a, b) => a.id.localeCompare(b.id))) {
  manifest[row.id] = {
    file: `/members-photos/${row.id}.jpg`,
    author: row.picture_author,
    license: row.picture_license,
    sourceUrl: row.picture_source_url,
  }
}
writeFileSync(`${outDir}/manifest.json`, JSON.stringify(manifest, null, 1))

const bytesBefore = results.reduce((sum, r) => sum + (r.before ?? 0), 0)
const bytesAfter = results.reduce((sum, r) => sum + (r.after ?? 0), 0)

const counts = results.reduce((acc, r) => ((acc[r.status] = (acc[r.status] ?? 0) + 1), acc), {})
const failed = results.filter((r) => r.status.startsWith('failed'))
console.log(`member-photos: ${Object.keys(manifest).length} in manifest (${JSON.stringify(counts)}), ${incomplete.length} skipped for incomplete attribution, ${legacyPngs.length} legacy PNGs removed, optimized ${(bytesBefore / 1e6).toFixed(1)}MB -> ${(bytesAfter / 1e6).toFixed(1)}MB, ${((Date.now() - started) / 1000).toFixed(1)}s -> public/members-photos`)
for (const f of failed) console.log(`  failed: ${f.id} (${f.status})`)
if (failed.length > targets.length * 0.05) process.exit(1)
