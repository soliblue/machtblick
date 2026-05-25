import { db } from '@machtblick/db/client'
import { antraege, antragSignatories, antraegeRaw } from '@machtblick/db/schema'
import { sql } from 'drizzle-orm'
import { readAllPages } from './cache.ts'
import { buildAntragRow } from './buildAntraege.ts'
import { buildPdfSignatoryRows, type AntragForPdfSignatures } from './buildPdfSignatories.ts'
import { buildSignatoryRows } from './buildSignatories.ts'
import type { Vorgang, Vorgangsposition, Aktivitaet } from './types.ts'

const ANTRAG_TYPES = ['Antrag', 'Gesetzgebung']
const fetchedAt = new Date().toISOString()

const slug = (t: string) =>
  t.toLowerCase().replace(/ß/g, 'ss').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function readVorgaengeAndPositions(types: string[]) {
  const vorgaenge: Vorgang[] = []
  const positionsByVorgang = new Map<string, Vorgangsposition[]>()
  for (const t of types) {
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
  return { vorgaenge, positionsByVorgang }
}

console.log('=== Antraege ===')
const antraegeData = readVorgaengeAndPositions(ANTRAG_TYPES)
const antragRows = antraegeData.vorgaenge
  .map((v) => ({ v, row: buildAntragRow(v, antraegeData.positionsByVorgang.get(v.id) ?? []) }))
  .filter((r): r is { v: typeof r.v; row: NonNullable<typeof r.row> } => r.row !== null)
console.log(`Ingesting ${antragRows.length} antraege`)

db.transaction((tx) => {
  for (const { v, row } of antragRows) {
    tx.insert(antraege).values(row).onConflictDoUpdate({ target: antraege.id, set: row }).run()
    tx.insert(antraegeRaw).values({
      antragId: row.id,
      vorgangJson: v,
      positionsJson: antraegeData.positionsByVorgang.get(v.id) ?? [],
      fetchedAt,
    }).onConflictDoUpdate({
      target: antraegeRaw.antragId,
      set: { vorgangJson: v, positionsJson: antraegeData.positionsByVorgang.get(v.id) ?? [], fetchedAt },
    }).run()
  }
})

console.log('=== Signatories ===')
const ALL_SIG_ARTEN = new Set(['Antrag', 'Gesetzentwurf'])
const relevantAkt: Aktivitaet[] = []
let scanned = 0
for (const a of readAllPages<Aktivitaet>('aktivitaet')) {
  scanned++
  if (ALL_SIG_ARTEN.has(a.aktivitaetsart)) relevantAkt.push(a)
}
console.log(`Aktivitaet scanned ${scanned}, kept ${relevantAkt.length}`)

const antragIds = new Set((db.all(sql`SELECT id FROM ${antraege}`) as Array<{ id: number }>).map((r) => r.id))
const relevant = relevantAkt.filter((a) =>
  (a.vorgangsbezug ?? []).some((vb) => {
    const tid = Number(vb.id)
    return antragIds.has(tid)
  })
)
const sigRows = buildSignatoryRows(relevant)
const structuredAntragSigs = sigRows.filter((r) => antragIds.has(r.targetId))
const pdfAntragSigs = await buildPdfSignatoryRows(antragRows.map(({ row }) => row as AntragForPdfSignatures), structuredAntragSigs)
const antragSigs = [...structuredAntragSigs, ...pdfAntragSigs]
console.log(`Resolved ${antragSigs.length} antrag signatories`)
console.log(`Resolved ${pdfAntragSigs.length} antrag signatories from PDF signature blocks`)

db.transaction((tx) => {
  for (const { row } of antragRows) tx.run(sql`DELETE FROM ${antragSignatories} WHERE antrag_id = ${row.id}`)
  for (const r of antragSigs) tx.insert(antragSignatories).values({ antragId: r.targetId, memberId: r.memberId, dipPersonId: r.dipPersonId }).onConflictDoNothing().run()
})

console.log('=== Counts ===')
const aCounts = db.all(sql`SELECT type, COUNT(*) as n FROM ${antraege} GROUP BY type`) as Array<{ type: string; n: number }>
for (const c of aCounts) console.log(`  antraege ${c.type}: ${c.n}`)
const atSigCount = (db.all(sql`SELECT COUNT(*) as n FROM ${antragSignatories}`) as Array<{ n: number }>)[0].n
console.log(`Total antrag signatories: ${atSigCount}`)

console.log('=== Vote linkage ===')
await import('./linkVotes.ts')
