export type LocalAwMandate = {
  rowId: number
  memberId: string
  btMdbId: string | null
  politicianId: number | null
  mandateId: number | null
  mandateType: string | null
  listState: string | null
  constituencyNumber: string | null
  constituencyName: string | null
  validFrom: string | null
  validTo: string | null
}

export type CurrentMandateAssignment = {
  memberId: string
  btMdbId: string | null
  politicianId: number
  mandateId: number
}

export type MandateCanonicalization = {
  sourceRowId: number
  targetRowId: number | null
  row: LocalAwMandate
}

export function canonicalizeLocalMandates(rows: LocalAwMandate[], assignments: CurrentMandateAssignment[]) {
  const canonical = rows.map((row) => ({ ...row }))
  const changes: MandateCanonicalization[] = []
  const claimedMembers = new Set<string>()
  const claimedMandates = new Set<number>()

  for (const assignment of assignments) {
    if (claimedMembers.has(assignment.memberId)) throw new Error(`duplicate canonical mandate member ${assignment.memberId}`)
    if (claimedMandates.has(assignment.mandateId)) throw new Error(`duplicate current AW mandate ${assignment.mandateId}`)
    claimedMembers.add(assignment.memberId)
    claimedMandates.add(assignment.mandateId)
    const sourceIndex = canonical.findIndex((row) => row.mandateId === assignment.mandateId)
    if (sourceIndex === -1) throw new Error(`missing local AW mandate ${assignment.mandateId}`)
    const source = canonical[sourceIndex]
    if (source.politicianId && source.politicianId !== assignment.politicianId) throw new Error(`AW politician conflict for mandate ${assignment.mandateId}`)
    const targetIndex = canonical.findIndex((row, index) => index !== sourceIndex && row.memberId === assignment.memberId && row.validFrom === source.validFrom)

    if (targetIndex !== -1) {
      const target = canonical[targetIndex]
      const merged = {
        ...target,
        btMdbId: compatible('bt_mdb_id', target.btMdbId, assignment.btMdbId),
        politicianId: compatible('aw_politician_id', target.politicianId, assignment.politicianId),
        mandateId: compatible('aw_mandate_id', target.mandateId, assignment.mandateId),
        mandateType: compatible('mandate_type', target.mandateType, source.mandateType),
        listState: compatible('list_state', target.listState, source.listState),
        constituencyNumber: compatible('constituency_number', target.constituencyNumber, source.constituencyNumber),
        constituencyName: compatible('constituency_name', target.constituencyName, source.constituencyName),
        validTo: compatible('valid_to', target.validTo, source.validTo),
      }
      changes.push({ sourceRowId: source.rowId, targetRowId: target.rowId, row: merged })
      canonical[targetIndex] = merged
      canonical.splice(sourceIndex, 1)
    } else {
      const moved = { ...source, memberId: assignment.memberId, btMdbId: assignment.btMdbId ?? source.btMdbId, politicianId: assignment.politicianId }
      if (source.memberId !== moved.memberId || source.btMdbId !== moved.btMdbId || source.politicianId !== moved.politicianId) {
        changes.push({ sourceRowId: source.rowId, targetRowId: null, row: moved })
      }
      canonical[sourceIndex] = moved
    }
  }

  return { rows: canonical, changes }
}

function compatible<T>(field: string, current: T | null, incoming: T | null) {
  if (current !== null && incoming !== null && current !== incoming) throw new Error(`${field} conflict: ${current} != ${incoming}`)
  return current ?? incoming
}
