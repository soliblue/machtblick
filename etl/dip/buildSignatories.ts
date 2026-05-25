import type { Aktivitaet } from './types.ts'
import { memberIdForDipPerson } from './resolveMember.ts'

const ANTRAG_ARTEN = new Set(['Antrag', 'Gesetzentwurf'])

export type SignatoryRow = {
  targetId: number
  memberId: string
  dipPersonId: number
}

export function buildSignatoryRows(aktivitaeten: Aktivitaet[]) {
  const rows: SignatoryRow[] = []
  const seen = new Set<string>()
  for (const a of aktivitaeten) {
    const isAntrag = ANTRAG_ARTEN.has(a.aktivitaetsart)
    if (!isAntrag) continue
    if (!a.person_id || !a.vorgangsbezug?.length) continue
    const dipPersonId = Number(a.person_id)
    const memberId = memberIdForDipPerson(dipPersonId)
    if (!memberId) continue
    for (const vb of a.vorgangsbezug) {
      const targetId = Number(vb.id)
      if (!targetId) continue
      const key = `${targetId}|${memberId}`
      if (seen.has(key)) continue
      seen.add(key)
      rows.push({ targetId, memberId, dipPersonId })
    }
  }
  return rows
}
