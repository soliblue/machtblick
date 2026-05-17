import type { Vorgang, Vorgangsposition } from './types.ts'
import { antragVorgangstypToSlug, isAntragIntroducingPosition, isGesetzentwurfPosition } from './normalize.ts'
import { antraege } from '@machtblick/db/schema'

type Row = typeof antraege.$inferInsert

const isBundestagDrucksache = (dnr?: string) => Boolean(dnr && /^21\/\d+$/.test(dnr))
const INITIATIVE_NORMALIZE: Record<string, string> = {
  'Fraktion der CDU/CSU': 'CDU/CSU',
  'Fraktion der SPD': 'SPD',
  'Fraktion der AfD': 'AfD',
  'Fraktion BÜNDNIS 90/DIE GRÜNEN': 'B90/Grüne',
  'Fraktion DIE LINKE': 'Die Linke',
  'Bundesministerium der Finanzen': 'Bundesregierung',
  'Bundesministerium für Wirtschaft und Energie': 'Bundesregierung',
}

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
    title: v.titel,
    abstract: v.abstract ?? null,
    beratungsstand: v.beratungsstand ?? null,
    wahlperiode: v.wahlperiode,
    initiativeFraktion: v.initiative?.map((part) => INITIATIVE_NORMALIZE[part] ?? part).join(', ') ?? null,
    introducedDate: introducing?.fundstelle?.datum ?? introducing?.datum ?? v.datum,
    drucksache: introducing?.fundstelle?.dokumentnummer ?? null,
    drucksachePdfUrl: introducing?.fundstelle?.pdf_url ?? null,
    sachgebiet: v.sachgebiet ?? null,
    deskriptor: v.deskriptor?.map((d) => ({ name: d.name, typ: d.typ })) ?? null,
    updatedAt: v.aktualisiert,
  }
}
