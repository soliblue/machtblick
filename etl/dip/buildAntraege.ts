import type { Vorgang, Vorgangsposition } from './types.ts'
import { antragVorgangstypToSlug, isAntragIntroducingPosition, isGesetzentwurfPosition } from './normalize.ts'
import { antraege } from '@machtblick/db/schema'
import { normalizePartyList } from '../_shared/parties.ts'
import { decodeHtmlEntities } from '../_shared/entities.mjs'

type Row = typeof antraege.$inferInsert

const isBundestagDrucksache = (dnr?: string) => Boolean(dnr && /^21\/\d+$/.test(dnr))

function pickIntroducingPosition(type: 'antrag' | 'gesetzentwurf', positions: Vorgangsposition[]) {
  const candidates = positions.filter(type === 'antrag' ? isAntragIntroducingPosition : isGesetzentwurfPosition)
  if (candidates.length === 0) return null
  const bt = candidates.find((p) => isBundestagDrucksache(p.fundstelle?.dokumentnummer))
  if (bt) return bt
  return candidates.sort((a, b) => (a.datum ?? '').localeCompare(b.datum ?? ''))[0]
}

export function buildAntragRow(v: Vorgang, positions: Vorgangsposition[]): Row | null {
  const type = antragVorgangstypToSlug(v.vorgangstyp)
  if (!type) return null
  const introducing = pickIntroducingPosition(type, positions)
  return {
    id: Number(v.id),
    type,
    title: decodeHtmlEntities(v.titel),
    abstract: v.abstract ? normalizeAntragAbstract(v.id, v.abstract) : null,
    beratungsstand: v.beratungsstand ?? null,
    wahlperiode: v.wahlperiode,
    initiativeFraktion: v.initiative ? normalizePartyList(v.initiative.join(', ')) : null,
    introducedDate: introducing?.fundstelle?.datum ?? introducing?.datum ?? v.datum,
    drucksache: introducing?.fundstelle?.dokumentnummer ?? null,
    drucksachePdfUrl: introducing?.fundstelle?.pdf_url ?? null,
    sachgebiet: v.sachgebiet ?? null,
    deskriptor: v.deskriptor?.map((d) => ({ name: d.name, typ: d.typ })) ?? null,
    updatedAt: v.aktualisiert,
  }
}

export function normalizeAntragAbstract(id: string, abstract: string): string {
  const decoded = decodeHtmlEntities(abstract)
  if (id !== '338368' || decoded.includes('ab dem Geburtsjahrgang 2020')) return decoded
  if (decoded.includes('ab dem Geburtsjahrgang 2000')) return decoded.replace('ab dem Geburtsjahrgang 2000', 'ab dem Geburtsjahrgang 2020')
  throw new Error(`unexpected DIP abstract for Vorgang ${id}`)
}
