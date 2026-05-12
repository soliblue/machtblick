import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { sql } from 'drizzle-orm'
import { db } from '@machtblick/db/client'
import { votes } from '@machtblick/db/schema'

const rawDir = fileURLToPath(new URL('../../bundestag-reden-xml/raw/xml/', import.meta.url))

const drucksacheRe = /\b21\/\d{1,5}\b/g
const topOpenRe = /<tagesordnungspunkt\s+top-id="([^"]+)"\s*>/g
const topCloseRe = /<\/tagesordnungspunkt>/g
const tDrsParaRe = /<p klasse="T_Drs"[^>]*>([\s\S]*?)<\/p>/g
const sitzungsnrRe = /<sitzungsnr>(\d+)<\/sitzungsnr>/
const verlaufOpenRe = /<sitzungsverlauf>/
const verlaufCloseRe = /<\/sitzungsverlauf>/

type TopBlock = {
  sessionId: string
  topId: string
  order: number
  drucksachen: Set<string>
  formalDrucksachen: Set<string>
  einzelplaene: Set<string>
}

const blocks: TopBlock[] = []

for (const file of readdirSync(rawDir).filter((f) => f.endsWith('.xml')).sort()) {
  const xml = readFileSync(join(rawDir, file), 'utf8')
  const sitMatch = xml.match(sitzungsnrRe)
  if (!sitMatch) continue
  const sessionId = `21-${Number(sitMatch[1])}`

  const verlaufStart = xml.match(verlaufOpenRe)?.index ?? 0
  const verlaufEnd = xml.match(verlaufCloseRe)?.index ?? xml.length
  const body = xml.slice(verlaufStart, verlaufEnd)

  const events: { idx: number; kind: 'open' | 'close'; topId?: string }[] = []
  for (const m of body.matchAll(topOpenRe)) events.push({ idx: m.index!, kind: 'open', topId: m[1] })
  for (const m of body.matchAll(topCloseRe)) events.push({ idx: m.index!, kind: 'close' })
  events.sort((a, b) => a.idx - b.idx)

  const stack: { topId: string; from: number; drucksachen: Set<string>; formal: Set<string>; einzelplaene: Set<string> }[] = []
  let order = 0
  for (const ev of events) {
    if (ev.kind === 'open') {
      stack.push({ topId: ev.topId!, from: ev.idx, drucksachen: new Set(), formal: new Set(), einzelplaene: new Set() })
      continue
    }
    const top = stack.pop()
    if (!top) continue
    const segment = body.slice(top.from, ev.idx)
    for (const dm of segment.matchAll(drucksacheRe)) top.drucksachen.add(dm[0])
    for (const tm of segment.matchAll(tDrsParaRe)) {
      for (const dm of tm[1].matchAll(drucksacheRe)) top.formal.add(dm[0])
    }
    const epOwn = top.topId.match(/^Einzelplan\s+(\d+)$/i)
    if (epOwn) top.einzelplaene.add(epOwn[1].padStart(2, '0'))
    for (const epm of segment.matchAll(/Einzelplan\s+(\d{1,2})\b/g)) top.einzelplaene.add(epm[1].padStart(2, '0'))
    blocks.push({ sessionId, topId: top.topId, order: order++, drucksachen: top.drucksachen, formalDrucksachen: top.formal, einzelplaene: top.einzelplaene })
  }
}

const voteRows = db.select({ id: votes.id, date: votes.date, title: votes.title, document: votes.document }).from(votes).where(sql`${votes.date} >= '2025-03-25'`).all()

const dateBySession = new Map<string, string>()
for (const row of voteRows) {
  const m = row.id.match(/^pp21-(\d+)-/)
  if (!m) continue
  dateBySession.set(`21-${Number(m[1])}`, row.date)
}

const sessionByDate = new Map<string, string>()
const datesPerSession = new Map<string, Set<string>>()
for (const row of voteRows) {
  const m = row.id.match(/^pp21-(\d+)-/)
  if (!m) continue
  const sid = `21-${Number(m[1])}`
  const set = datesPerSession.get(sid) ?? new Set()
  set.add(row.date)
  datesPerSession.set(sid, set)
  sessionByDate.set(row.date, sid)
}

type Resolution = { voteId: string; topId: string; note?: string }
const resolutions: Resolution[] = []
const unresolved: { voteId: string; date: string; document: string; reason: string }[] = []

for (const row of voteRows) {
  const docDrucksachen = new Set<string>()
  for (const m of (row.document ?? '').matchAll(drucksacheRe)) docDrucksachen.add(m[0])

  const m = row.id.match(/^pp21-(\d+)-/)
  const sessionId = m ? `21-${Number(m[1])}` : sessionByDate.get(row.date) ?? null

  const einzelplan = row.title?.match(/^Einzelplan\s+(\d+)/i) ?? row.id.match(/-einzelplan-(\d+)-/i)
  if (einzelplan && sessionId) {
    const epId = einzelplan[1].padStart(2, '0')
    const hits = blocks.filter((b) => b.sessionId === sessionId && b.einzelplaene.has(epId))
    if (hits.length > 0) {
      hits.sort((a, b) => a.order - b.order)
      resolutions.push({ voteId: row.id, topId: hits[0].topId })
      continue
    }
  }

  if (docDrucksachen.size === 0) {
    unresolved.push({ voteId: row.id, date: row.date, document: row.document ?? '', reason: 'no-drucksache' })
    continue
  }

  const candidates = blocks.filter((b) => {
    if (sessionId && b.sessionId !== sessionId) return false
    for (const d of docDrucksachen) if (!b.drucksachen.has(d)) return false
    return true
  })

  if (candidates.length === 0) {
    unresolved.push({ voteId: row.id, date: row.date, document: row.document ?? '', reason: 'no-match' })
    continue
  }

  const formalMatches = candidates.filter((c) => {
    for (const d of docDrucksachen) if (!c.formalDrucksachen.has(d)) return false
    return true
  })
  const pool = formalMatches.length > 0 ? formalMatches : candidates

  const distinctTops = new Set(pool.map((c) => c.topId))
  if (distinctTops.size === 1) {
    resolutions.push({ voteId: row.id, topId: pool[0].topId })
    continue
  }

  pool.sort((a, b) => a.order - b.order)
  resolutions.push({ voteId: row.id, topId: pool[0].topId, note: `tiebreak:first-of:${[...distinctTops].join('|')}` })
}

const dryRun = process.argv.includes('--dry-run')
if (!dryRun) {
  db.transaction((tx) => {
    for (const r of resolutions) {
      tx.update(votes).set({ agendaItem: r.topId }).where(sql`${votes.id} = ${r.voteId}`).run()
    }
  })
}

console.log(`votes total (>=2025-03-25): ${voteRows.length}`)
console.log(`top blocks parsed: ${blocks.length} across ${new Set(blocks.map((b) => b.sessionId)).size} sessions`)
const tiebroken = resolutions.filter((r) => r.note).length
console.log(`resolved: ${resolutions.length} (clean: ${resolutions.length - tiebroken}, tiebroken: ${tiebroken})`)
console.log(`unresolved: ${unresolved.length}`)

const reasonCounts = new Map<string, number>()
for (const u of unresolved) {
  const key = u.reason.startsWith('ambiguous') ? 'ambiguous' : u.reason
  reasonCounts.set(key, (reasonCounts.get(key) ?? 0) + 1)
}
console.log(`\nunresolved by reason:`)
for (const [k, n] of reasonCounts) console.log(`  ${k.padEnd(20)} ${n}`)

console.log(`\nfirst 10 unresolved samples:`)
for (const u of unresolved.slice(0, 10)) console.log(`  ${u.voteId} (${u.date}) [${u.reason}] doc="${u.document.slice(0, 80)}"`)

console.log(`\ntiebroken samples:`)
for (const r of resolutions.filter((r) => r.note).slice(0, 10)) console.log(`  ${r.voteId} -> ${r.topId} [${r.note}]`)

if (dryRun) console.log(`\n(dry-run, no DB writes)`)
