import type { Vorgang, Vorgangsposition } from './types.ts'
import { isAnswerPosition, isQuestionPosition, vorgangstypToSlug } from './normalize.ts'
import { anfragen } from '@machtblick/db/schema'

type Row = typeof anfragen.$inferInsert

export function buildAnfrageRow(v: Vorgang, positions: Vorgangsposition[]): Row | null {
  const type = vorgangstypToSlug(v.vorgangstyp)
  if (!type) return null
  const question = positions.find(isQuestionPosition)
  const answer = type === 'schriftlich'
    ? question
    : positions.find((p) => p.vorgangsposition === 'Antwort')
  const answerHasAntwort = answer && isAnswerPosition(answer)
  const federfuehrend = answer?.ressort?.find((r) => r.federfuehrend) ?? answer?.ressort?.[0]
  return {
    id: Number(v.id),
    type,
    title: v.titel,
    abstract: v.abstract ?? null,
    beratungsstand: v.beratungsstand ?? null,
    wahlperiode: v.wahlperiode,
    initiativeFraktion: v.initiative?.[0] ?? null,
    questionDate: question?.fundstelle?.datum ?? question?.datum ?? v.datum,
    answerDate: answerHasAntwort ? (answer?.fundstelle?.datum ?? answer?.datum ?? null) : null,
    questionDrucksache: question?.fundstelle?.dokumentnummer ?? null,
    answerDrucksache: answerHasAntwort ? (answer?.fundstelle?.dokumentnummer ?? null) : null,
    questionPdfUrl: question?.fundstelle?.pdf_url ?? null,
    answerPdfUrl: answerHasAntwort ? (answer?.fundstelle?.pdf_url ?? null) : null,
    answerRessort: federfuehrend?.titel ?? null,
    sachgebiet: v.sachgebiet ?? null,
    deskriptor: v.deskriptor?.map((d) => ({ name: d.name, typ: d.typ })) ?? null,
    updatedAt: v.aktualisiert,
  }
}
