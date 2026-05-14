import type { Aktivitaet } from './types.ts'
import { memberIdForDipPerson } from './resolveMember.ts'

const ANFRAGE_ARTEN = new Set(['Kleine Anfrage', 'Große Anfrage', 'Frage'])
const ANTRAG_ARTEN = new Set(['Antrag', 'Gesetzentwurf'])

export type SignatoryRow = {
  kind: 'anfrage' | 'antrag'
  targetId: number
  memberId: string
  dipPersonId: number
}

export function buildSignatoryRows(aktivitaeten: Aktivitaet[]) {
  const rows: SignatoryRow[] = []
  const seen = new Set<string>()
  for (const a of aktivitaeten) {
    const isAnfrage = ANFRAGE_ARTEN.has(a.aktivitaetsart)
    const isAntrag = ANTRAG_ARTEN.has(a.aktivitaetsart)
    if (!isAnfrage && !isAntrag) continue
    if (!a.person_id || !a.vorgangsbezug?.[0]) continue
    const dipPersonId = Number(a.person_id)
    const memberId = memberIdForDipPerson(dipPersonId)
    if (!memberId) continue
    const targetId = Number(a.vorgangsbezug[0].id)
    const kind: 'anfrage' | 'antrag' = isAnfrage ? 'anfrage' : 'antrag'
    const key = `${kind}|${targetId}|${memberId}`
    if (seen.has(key)) continue
    seen.add(key)
    rows.push({ kind, targetId, memberId, dipPersonId })
  }
  return rows
}
