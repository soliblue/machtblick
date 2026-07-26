import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { candidates, parties } from './catalog'

const urls = [...new Set([
  ...parties.flatMap(({ programmeUrl, candidateUrl }) => [programmeUrl, candidateUrl]),
  ...candidates.map(({ sourceUrl }) => sourceUrl)
].filter((url): url is string => Boolean(url)))]
const cacheDirectory = new URL('./.cache/', import.meta.url)
const manifest: { url: string; file: string; contentType: string; retrievedAt: string }[] = []

await mkdir(fileURLToPath(cacheDirectory), { recursive: true })
for (let start = 0; start < urls.length; start += 5) {
  await Promise.all(urls.slice(start, start + 5).map(async (url) => {
    const response = await fetch(url, { headers: { 'user-agent': 'Machtblick election research contact@machtblick.de' } })
    if (!response.ok) throw new Error(`${response.status} ${url}`)
    const contentType = response.headers.get('content-type') ?? 'application/octet-stream'
    const extension = contentType.includes('pdf') ? 'pdf' : 'html'
    const file = `${createHash('sha256').update(url).digest('hex').slice(0, 16)}.${extension}`
    await writeFile(new URL(file, cacheDirectory), Buffer.from(await response.arrayBuffer()))
    manifest.push({ url, file, contentType, retrievedAt: new Date().toISOString() })
  }))
}
await writeFile(new URL('manifest.json', cacheDirectory), `${JSON.stringify(manifest.sort((a, b) => a.url.localeCompare(b.url)), null, 2)}\n`)
