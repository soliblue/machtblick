import type { Aktivitaet } from './types.ts'
import { memberIdForDipPerson } from './resolveMember.ts'

const SIGNATORY_ARTEN = new Set(['Kleine Anfrage', 'Große Anfrage', 'Frage'])

export function buildSignatoryRows(aktivitaeten: Aktivitaet[]) {
  const rows: { anfrageId: number; memberId: string; dipPersonId: number }[] = []
  const seen = new Set<string>()
  for (const a of aktivitaeten) {
    if (!SIGNATORY_ARTEN.has(a.aktivitaetsart)) continue
    if (!a.person_id || !a.vorgangsbezug?.[0]) continue
    const dipPersonId = Number(a.person_id)
    const memberId = memberIdForDipPerson(dipPersonId)
    if (!memberId) continue
    const anfrageId = Number(a.vorgangsbezug[0].id)
    const key = `${anfrageId}|${memberId}`
    if (seen.has(key)) continue
    seen.add(key)
    rows.push({ anfrageId, memberId, dipPersonId })
  }
  return rows
}
