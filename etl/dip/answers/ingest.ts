import { db } from '@machtblick/db/client'
import { anfragenAnswerText } from '@machtblick/db/schema'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, txtPath, metaPath } from './cache.ts'

const ids = readdirSync(ROOT)
  .filter((f) => f.endsWith('.txt'))
  .map((f) => Number(f.replace('.txt', '')))
  .filter((n) => Number.isFinite(n))

console.log(`ingest: ${ids.length} extracted text files`)

let done = 0
let skipped = 0
const sources: Record<string, number> = {}

db.transaction((tx) => {
  for (const id of ids) {
    const text = readFileSync(txtPath(id), 'utf8')
    const metaFile = metaPath(id)
    const meta = existsSync(metaFile) ? JSON.parse(readFileSync(metaFile, 'utf8')) as { source: string; extractedAt: string } : { source: 'pdftotext', extractedAt: new Date().toISOString() }
    const source = (meta.source as 'pdftotext' | 'pdfjs' | 'claude-haiku' | 'claude-sonnet') ?? 'pdftotext'
    if (text.length === 0) { skipped++; continue }
    tx.insert(anfragenAnswerText).values({ anfrageId: id, text, extractedAt: meta.extractedAt, source }).onConflictDoUpdate({
      target: anfragenAnswerText.anfrageId,
      set: { text, extractedAt: meta.extractedAt, source },
    }).run()
    sources[source] = (sources[source] ?? 0) + 1
    done++
    if (done % 500 === 0) console.log(`  ingested ${done}/${ids.length}`)
  }
})

console.log(`ingest: complete. done=${done} skipped=${skipped} sources=${JSON.stringify(sources)}`)
