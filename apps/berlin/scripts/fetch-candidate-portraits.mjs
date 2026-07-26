import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { encodeCandidatePortraitJpeg } from './candidate-portrait-jpeg.mjs'

const userAgent = 'machtblick-berlin/0.1 (https://github.com/soliblue/machtblick; hello@machtblick.de)'
const width = 320
const delayMs = 150
const maxAttempts = 5
const appRoot = fileURLToPath(new URL('..', import.meta.url))
const outputDirectory = `${appRoot}public/candidate-portraits`
const manifestPath = `${outputDirectory}/manifest.json`
const portraits = JSON.parse(readFileSync(`${appRoot}../../research/berlin-2026/candidate-portraits.json`, 'utf8'))
const previousManifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {}

mkdirSync(outputDirectory, { recursive: true })

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
const targets = portraits.filter(({ status, license, imageUrl, sourceUrl }) =>
  status === 'licensed' && license && imageUrl.startsWith('https://') && sourceUrl.startsWith('https://'))

async function download(portrait) {
  const file = `${portrait.candidateSlug}.jpg`
  const path = `${outputDirectory}/${file}`
  if (
    previousManifest[portrait.candidateSlug]?.imageUrl === portrait.imageUrl
    && existsSync(path)
    && statSync(path).size > 0
    && (await sharp(readFileSync(path)).metadata()).format === 'jpeg'
  ) return { candidateSlug: portrait.candidateSlug, file, status: 'cached' }
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(portrait.imageUrl, { headers: { 'User-Agent': userAgent } }).catch(() => null)
    await sleep(delayMs)
    if (response?.ok) {
      const output = await encodeCandidatePortraitJpeg(Buffer.from(await response.arrayBuffer()), width)
      writeFileSync(path, output)
      return { candidateSlug: portrait.candidateSlug, file, status: 'downloaded' }
    }
    if (response && response.status !== 429 && response.status < 500) {
      return { candidateSlug: portrait.candidateSlug, status: `failed ${response.status}` }
    }
    await sleep(Math.max(Number(response?.headers.get('retry-after') ?? 0) * 1000, 1000 * 2 ** attempt))
  }
  return { candidateSlug: portrait.candidateSlug, status: 'failed retries' }
}

const results = []
for (const portrait of targets) results.push(await download(portrait))

const completedSlugs = new Set(results.filter(({ file }) => file).map(({ candidateSlug }) => candidateSlug))
const completedFiles = new Set([...completedSlugs].map((slug) => `${slug}.jpg`))
for (const file of readdirSync(outputDirectory)) {
  if (file !== 'manifest.json' && !completedFiles.has(file) && statSync(`${outputDirectory}/${file}`).isFile()) {
    unlinkSync(`${outputDirectory}/${file}`)
  }
}

const manifest = {}
for (const portrait of targets.filter(({ candidateSlug }) => completedSlugs.has(candidateSlug)).sort((a, b) => a.candidateSlug.localeCompare(b.candidateSlug))) {
  manifest[portrait.candidateSlug] = {
    file: `/candidate-portraits/${portrait.candidateSlug}.jpg`,
    imageUrl: portrait.imageUrl,
    sourceUrl: portrait.sourceUrl,
    publisher: portrait.publisher,
    author: portrait.author,
    license: portrait.license
  }
}
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 1)}\n`)

const failed = results.filter(({ status }) => status.startsWith('failed'))
const counts = results.reduce((result, { status }) => ({ ...result, [status]: (result[status] ?? 0) + 1 }), {})
console.log(`candidate-portraits: ${Object.keys(manifest).length} local JPEGs (${JSON.stringify(counts)})`)
for (const result of failed) console.log(`  failed: ${result.candidateSlug} (${result.status})`)
if (failed.length) process.exit(1)
