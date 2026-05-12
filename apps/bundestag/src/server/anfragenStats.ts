import { createServerFn } from '@tanstack/react-start'
import { db } from '@machtblick/db/client'
import { anfragen, anfrageSignatories } from '@machtblick/db/schema'
import { SLUG_TO_PARTY } from '@/lib/parties'
import { loadAffiliationsByMember, partyAt } from './memberParty'

export type PartyAnfragenTypeSplit = {
  kleine: number
  grosse: number
  schriftlich: number
  total: number
}

export type PartyAnfragenTopic = { name: string; count: number }

export type PartyAnfragenStats = {
  slug: string
  party: string
  total: number
  byType: PartyAnfragenTypeSplit
  topSachgebiete: PartyAnfragenTopic[]
  topDeskriptoren: PartyAnfragenTopic[]
}

export const getAnfragenStatsForParty = createServerFn({ method: 'GET' })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<PartyAnfragenStats> => {
    const party = SLUG_TO_PARTY[slug]
    if (!party) throw new Error(`party not found: ${slug}`)
    const empty: PartyAnfragenStats = {
      slug,
      party,
      total: 0,
      byType: { kleine: 0, grosse: 0, schriftlich: 0, total: 0 },
      topSachgebiete: [],
      topDeskriptoren: [],
    }
    const affByMember = loadAffiliationsByMember()
    const records = db.select().from(anfragen).all()
    const recordById = new Map(records.map((r) => [r.id, r]))
    const sigs = db
      .select({ anfrageId: anfrageSignatories.anfrageId, memberId: anfrageSignatories.memberId })
      .from(anfrageSignatories)
      .all()
    if (!sigs.length) return empty
    const partyAnfrageIds = new Set<number>()
    for (const sig of sigs) {
      const rec = recordById.get(sig.anfrageId)
      if (!rec || !rec.questionDate) continue
      if (partyAnfrageIds.has(sig.anfrageId)) continue
      const p = partyAt(affByMember.get(sig.memberId), rec.questionDate)
      if (p === party) partyAnfrageIds.add(sig.anfrageId)
    }
    const byType = { kleine: 0, grosse: 0, schriftlich: 0 }
    const sachCounts = new Map<string, number>()
    const deskCounts = new Map<string, number>()
    for (const id of partyAnfrageIds) {
      const rec = recordById.get(id)!
      byType[rec.type] += 1
      for (const s of rec.sachgebiet ?? []) sachCounts.set(s, (sachCounts.get(s) ?? 0) + 1)
      for (const d of rec.deskriptor ?? []) deskCounts.set(d.name, (deskCounts.get(d.name) ?? 0) + 1)
    }
    const total = partyAnfrageIds.size
    const topSachgebiete = Array.from(sachCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'de'))
      .slice(0, 8)
    const topDeskriptoren = Array.from(deskCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'de'))
      .slice(0, 12)
    return {
      slug,
      party,
      total,
      byType: { ...byType, total },
      topSachgebiete,
      topDeskriptoren,
    }
  })
