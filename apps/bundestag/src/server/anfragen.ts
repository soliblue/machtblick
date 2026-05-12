import { createServerFn } from '@tanstack/react-start'
import { db } from '@machtblick/db/client'
import { anfragen, anfrageSignatories } from '@machtblick/db/schema'
import { eq, desc, inArray, sql } from 'drizzle-orm'

export type AnfrageRow = {
  id: number
  type: 'kleine' | 'grosse' | 'schriftlich'
  title: string
  questionDate: string | null
  answerDate: string | null
  beratungsstand: string | null
  answerRessort: string | null
  questionDrucksache: string | null
  answerDrucksache: string | null
  questionPdfUrl: string | null
  answerPdfUrl: string | null
  sachgebiet: string[]
  cosignerCount: number
}

export type AnfrageGroup = {
  sachgebiet: string
  count: number
  rows: AnfrageRow[]
}

export type MemberAnfragen = {
  total: number
  byType: { kleine: number; grosse: number; schriftlich: number }
  flat: AnfrageRow[]
  groups: AnfrageGroup[]
}

const UNCATEGORIZED = 'Ohne Sachgebiet'

export const getAnfragenForMember = createServerFn({ method: 'GET' })
  .inputValidator((memberId: string) => memberId)
  .handler(async ({ data: memberId }): Promise<MemberAnfragen> => {
    const signed = db
      .select({ anfrageId: anfrageSignatories.anfrageId })
      .from(anfrageSignatories)
      .where(eq(anfrageSignatories.memberId, memberId))
      .all()
    const anfrageIds = signed.map((s) => s.anfrageId)
    const empty: MemberAnfragen = { total: 0, byType: { kleine: 0, grosse: 0, schriftlich: 0 }, flat: [], groups: [] }
    if (!anfrageIds.length) return empty
    const records = db
      .select()
      .from(anfragen)
      .where(inArray(anfragen.id, anfrageIds))
      .orderBy(desc(anfragen.questionDate))
      .all()
    const cosignerCounts = db
      .select({ anfrageId: anfrageSignatories.anfrageId, n: sql<number>`count(*)`.as('n') })
      .from(anfrageSignatories)
      .where(inArray(anfrageSignatories.anfrageId, anfrageIds))
      .groupBy(anfrageSignatories.anfrageId)
      .all()
    const countById = new Map(cosignerCounts.map((c) => [c.anfrageId, c.n]))
    const flat: AnfrageRow[] = records.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      questionDate: r.questionDate,
      answerDate: r.answerDate,
      beratungsstand: r.beratungsstand,
      answerRessort: r.answerRessort,
      questionDrucksache: r.questionDrucksache,
      answerDrucksache: r.answerDrucksache,
      questionPdfUrl: r.questionPdfUrl,
      answerPdfUrl: r.answerPdfUrl,
      sachgebiet: r.sachgebiet ?? [],
      cosignerCount: Math.max((countById.get(r.id) ?? 1) - 1, 0),
    }))
    const byType = { kleine: 0, grosse: 0, schriftlich: 0 }
    for (const row of flat) byType[row.type] += 1
    const groupMap = new Map<string, AnfrageRow[]>()
    for (const row of flat) {
      const keys = row.sachgebiet.length ? row.sachgebiet : [UNCATEGORIZED]
      for (const key of keys) {
        const arr = groupMap.get(key) ?? []
        arr.push(row)
        groupMap.set(key, arr)
      }
    }
    const groups: AnfrageGroup[] = Array.from(groupMap.entries())
      .map(([sachgebiet, rows]) => ({ sachgebiet, count: rows.length, rows }))
      .sort((a, b) => b.count - a.count || a.sachgebiet.localeCompare(b.sachgebiet, 'de'))
    return { total: flat.length, byType, flat, groups }
  })
