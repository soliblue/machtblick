import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const sourceUrl = 'https://www.bundestag.de/resource/blob/472878/c2ee46c6dadbf6f06ee27d5618fd24e9/MdB-Stammdaten-data.zip'
const rawDir = fileURLToPath(new URL('./raw/', import.meta.url))
const zipPath = `${rawDir}MdB-Stammdaten-data.zip`
const xmlPath = `${rawDir}MDB_STAMMDATEN.XML`
const force = process.argv.includes('--force')

if (!existsSync(rawDir)) mkdirSync(rawDir, { recursive: true })

if (existsSync(xmlPath) && !force) {
  console.log(`skip: ${xmlPath} exists (use --force to refresh)`)
  process.exit(0)
}

const res = await fetch(sourceUrl, { headers: { 'User-Agent': 'machtblick-etl' } })
if (!res.ok) throw new Error(`fetch ${sourceUrl}: ${res.status}`)
const buf = Buffer.from(await res.arrayBuffer())
writeFileSync(zipPath, buf)
console.log(`downloaded ${zipPath} (${buf.length} bytes)`)

execFileSync('unzip', ['-o', zipPath, 'MDB_STAMMDATEN.XML', '-d', rawDir], { stdio: 'inherit' })
console.log(`extracted ${xmlPath}`)
