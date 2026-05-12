import { db } from '@machtblick/db/client'
import { anfragen } from '@machtblick/db/schema'
import { sql } from 'drizzle-orm'
import { writeFileSync, openSync, fsyncSync, closeSync } from 'node:fs'
import { ensureRoot, pdfPath, hasPdf } from './cache.ts'

ensureRoot()

const CONCURRENCY = 6
const DELAY_MS = 120

const rows = db.all(sql`SELECT id, answer_pdf_url FROM ${anfragen} WHERE answer_pdf_url IS NOT NULL AND answer_pdf_url != ''`) as Array<{ id: number; answer_pdf_url: string }>
console.log(`fetch: ${rows.length} anfragen with answer_pdf_url`)

const todo = rows.filter((r) => !hasPdf(r.id))
console.log(`fetch: ${todo.length} to download, ${rows.length - todo.length} already cached`)

let done = 0
let failed = 0

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function downloadOne(row: { id: number; answer_pdf_url: string }) {
  const res = await fetch(row.answer_pdf_url, { headers: { 'User-Agent': 'machtblick-etl/1.0 (contact via github)' } })
  if (!res.ok) {
    failed++
    console.warn(`  ${row.id}: HTTP ${res.status} ${row.answer_pdf_url}`)
    return
  }
  const buf = Buffer.from(await res.arrayBuffer())
  const fd = openSync(pdfPath(row.id), 'w')
  writeFileSync(fd, buf)
  fsyncSync(fd)
  closeSync(fd)
  done++
  if (done % 50 === 0) console.log(`  fetched ${done}/${todo.length} (${failed} failed)`)
}

const queue = [...todo]
const workers = Array.from({ length: CONCURRENCY }, async () => {
  while (queue.length > 0) {
    const row = queue.shift()
    if (!row) return
    await downloadOne(row)
    await sleep(DELAY_MS)
  }
})

await Promise.all(workers)
console.log(`fetch: complete. downloaded=${done} failed=${failed} cached=${rows.length - todo.length}`)
