import { writeFile, mkdir, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const API = 'https://search.dip.bundestag.de/api/v1'
const KEY = process.env.DIP_API_KEY ?? 'JuUJMTh.aode9HMRTazR7NwudVElhD26LeNADLxxST'
const OUT = new URL('./raw/', import.meta.url).pathname

await mkdir(OUT, { recursive: true })
const existing = new Set((await readdir(OUT)).map((f) => f.replace(/\.xml$/, '')))

const list = await fetch(`${API}/plenarprotokoll?apikey=${KEY}&f.wahlperiode=21&f.zuordnung=BT&format=json`).then((r) => r.json())
console.log(`api lists ${list.numFound} protocols`)

for (const doc of list.documents) {
  const key = doc.dokumentnummer.replace('/', '-')
  if (existing.has(key)) continue
  const xml = await fetch(`${API}/plenarprotokoll-text/${doc.id}?apikey=${KEY}&format=xml`).then((r) => r.text())
  await writeFile(join(OUT, `${key}.xml`), xml)
  console.log(`fetched ${doc.dokumentnummer} (${doc.datum})`)
}
