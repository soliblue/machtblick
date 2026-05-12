import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const force = process.argv.includes('--force')
const rawDir = fileURLToPath(new URL('./raw/xml/', import.meta.url))
mkdirSync(rawDir, { recursive: true })

const url = (n: number) => `https://dserver.bundestag.de/btp/21/21${String(n).padStart(3, '0')}.xml`

let n = 1
let consecutive404 = 0
let downloaded = 0
let skipped = 0

while (consecutive404 < 3) {
  const file = join(rawDir, `21${String(n).padStart(3, '0')}.xml`)
  if (!force && existsSync(file)) {
    skipped++
    consecutive404 = 0
    n++
    continue
  }
  const res = await fetch(url(n))
  if (res.status === 404) {
    consecutive404++
    n++
    continue
  }
  if (!res.ok) throw new Error(`unexpected ${res.status} for ${url(n)}`)
  const body = await res.text()
  writeFileSync(file, body)
  downloaded++
  consecutive404 = 0
  console.log(`fetched session ${n}`)
  n++
}

console.log(`\ndone. downloaded=${downloaded}, skipped=${skipped}, stopped at session ${n - 3}`)
