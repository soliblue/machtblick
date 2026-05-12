import { db } from '@machtblick/db/client'
import { anfragen, anfrageSignatories, anfragenRaw } from '@machtblick/db/schema'
import { sql } from 'drizzle-orm'
import { readAllPages } from './cache.ts'
import { buildAnfrageRow } from './buildAnfragen.ts'
import { buildSignatoryRows } from './buildSignatories.ts'
import type { Vorgang, Vorgangsposition, Aktivitaet } from './types.ts'

const TYPES = ['Kleine Anfrage', 'Große Anfrage', 'Schriftliche Frage']
const fetchedAt = new Date().toISOString()

const slug = (t: string) =>
  t.toLowerCase().replace(/ß/g, 'ss').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const vorgaenge: Vorgang[] = []
const positionsByVorgang = new Map<string, Vorgangsposition[]>()

for (const t of TYPES) {
  const s = slug(t)
  let vCount = 0
  for (const v of readAllPages<Vorgang>(`vorgang/${s}`)) {
    vorgaenge.push(v)
    vCount++
  }
  let pCount = 0
  for (const p of readAllPages<Vorgangsposition>(`vorgangsposition/${s}`)) {
    const list = positionsByVorgang.get(p.vorgang_id) ?? []
    list.push(p)
    positionsByVorgang.set(p.vorgang_id, list)
    pCount++
  }
  console.log(`${t}: ${vCount} vorgaenge, ${pCount} positions`)
}

const rows = vorgaenge
  .map((v) => ({ v, row: buildAnfrageRow(v, positionsByVorgang.get(v.id) ?? []) }))
  .filter((r): r is { v: typeof r.v; row: NonNullable<typeof r.row> } => r.row !== null)
console.log(`Ingesting ${rows.length} anfragen`)

db.transaction((tx) => {
  for (const { v, row } of rows) {
    tx.insert(anfragen).values(row).onConflictDoUpdate({ target: anfragen.id, set: row }).run()
    tx.insert(anfragenRaw).values({
      anfrageId: row.id,
      vorgangJson: v,
      positionsJson: positionsByVorgang.get(v.id) ?? [],
      fetchedAt,
    }).onConflictDoUpdate({
      target: anfragenRaw.anfrageId,
      set: { vorgangJson: v, positionsJson: positionsByVorgang.get(v.id) ?? [], fetchedAt },
    }).run()
  }
})

const ANFRAGE_ARTEN = new Set(['Kleine Anfrage', 'Große Anfrage', 'Frage'])
const relevantAkt: Aktivitaet[] = []
let scanned = 0
for (const a of readAllPages<Aktivitaet>('aktivitaet')) {
  scanned++
  if (ANFRAGE_ARTEN.has(a.aktivitaetsart)) relevantAkt.push(a)
}
console.log(`Aktivitaet scanned ${scanned}, kept ${relevantAkt.length}`)

const existingIds = (db.all(sql`SELECT id FROM ${anfragen}`) as Array<{ id: number }>).map((r) => r.id)
const anfrageIds = new Set(existingIds)
const relevant = relevantAkt.filter((a) => a.vorgangsbezug?.[0] && anfrageIds.has(Number(a.vorgangsbezug[0].id)))
const sigRows = buildSignatoryRows(relevant)
console.log(`Resolved ${sigRows.length} signatories`)

db.transaction((tx) => {
  const ids = [...new Set(sigRows.map((r) => r.anfrageId))]
  for (const id of ids) tx.run(sql`DELETE FROM ${anfrageSignatories} WHERE anfrage_id = ${id}`)
  for (const r of sigRows) tx.insert(anfrageSignatories).values(r).onConflictDoNothing().run()
})

const counts = db.all(sql`SELECT type, COUNT(*) as n FROM ${anfragen} GROUP BY type`) as Array<{ type: string; n: number }>
for (const c of counts) console.log(`  ${c.type}: ${c.n}`)
const sigCount = db.all(sql`SELECT COUNT(*) as n FROM ${anfrageSignatories}`) as Array<{ n: number }>
console.log(`Total signatories: ${sigCount[0].n}`)
