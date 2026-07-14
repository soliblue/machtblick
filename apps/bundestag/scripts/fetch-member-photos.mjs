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
const manifestPath = `${outDir}/manifest.json`
const previousManifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {}

const db = new Database(`${root}../../db/machtblick.sqlite`, { readonly: true })
const rows = db.prepare(`
  SELECT DISTINCT m.id, m.picture_url, m.picture_author, m.picture_license, m.picture_source_url
  FROM members m
  WHERE EXISTS (SELECT 1 FROM member_affiliations a WHERE a.member_id = m.id AND a.term_id = 21)
  ORDER BY m.id
`).all()
db.close()

const completeMetadata = rows.filter((r) => r.picture_author && r.picture_license && r.picture_source_url)
const targets = completeMetadata.map((row) => ({ ...row, downloadUrl: sourceImageUrl(row.picture_source_url) })).filter((row) => row.downloadUrl)
const targetIds = new Set(targets.map((row) => row.id))
const remoteOnly = rows.filter((row) => row.picture_url && !targetIds.has(row.id))
const withoutPortrait = rows.filter((row) => !row.picture_url && !targetIds.has(row.id))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const localFiles = readdirSync(outDir).filter((file) => file !== 'manifest.json')
const existingFile = (id) => [`${id}.jpg`, ...localFiles.filter((file) => file.startsWith(`${id}.`) && file !== `${id}.jpg`)].find((file) => existsSync(`${outDir}/${file}`) && statSync(`${outDir}/${file}`).isFile() && statSync(`${outDir}/${file}`).size > 0)

function sourceImageUrl(sourceUrl) {
  const url = new URL(sourceUrl)
  const prefix = '/wiki/File:'
  return url.hostname === 'commons.wikimedia.org' && url.pathname.startsWith(prefix)
    ? `https://commons.wikimedia.org/wiki/Special:FilePath/${url.pathname.slice(prefix.length)}?width=${WIDTH}`
    : null
}

async function download(row) {
  const cached = previousManifest[row.id]?.sourceUrl === row.picture_source_url ? existingFile(row.id) : undefined
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
    const res = await fetch(row.downloadUrl, { headers: { 'User-Agent': UA } }).catch(() => null)
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
const completedFiles = new Set([...completedIds].map((id) => `${id}.jpg`))
const removedImages = readdirSync(outDir).filter((file) => file !== 'manifest.json' && !completedFiles.has(file) && statSync(`${outDir}/${file}`).isFile())
for (const file of removedImages) unlinkSync(`${outDir}/${file}`)
const manifest = {}
for (const row of targets.filter((r) => completedIds.has(r.id)).sort((a, b) => a.id.localeCompare(b.id))) {
  manifest[row.id] = {
    file: `/members-photos/${row.id}.jpg`,
    author: row.picture_author,
    license: row.picture_license,
    sourceUrl: row.picture_source_url,
  }
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 1))

for (const row of Object.values(manifest)) {
  if ((await sharp(readFileSync(`${root}public${row.file}`)).metadata()).format !== 'jpeg') throw new Error(`${row.file} is not JPEG`)
}

const bytesBefore = results.reduce((sum, r) => sum + (r.before ?? 0), 0)
const bytesAfter = results.reduce((sum, r) => sum + (r.after ?? 0), 0)

const counts = results.reduce((acc, r) => ((acc[r.status] = (acc[r.status] ?? 0) + 1), acc), {})
const failed = results.filter((r) => r.status.startsWith('failed'))
console.log(`member-photos: ${Object.keys(manifest).length} local JPEGs, ${remoteOnly.length} remote-only, ${withoutPortrait.length} without portrait, ${completeMetadata.length - targets.length} unsupported attributable sources, ${removedImages.length} stale or mixed images removed (${JSON.stringify(counts)}), optimized ${(bytesBefore / 1e6).toFixed(1)}MB -> ${(bytesAfter / 1e6).toFixed(1)}MB, ${((Date.now() - started) / 1000).toFixed(1)}s -> public/members-photos`)
for (const f of failed) console.log(`  failed: ${f.id} (${f.status})`)
if (failed.length) process.exit(1)
