export type MemberMandateIdRow = {
  termId: number
  mandateBtMdbId: string | null
  memberBtMdbId: string | null
}

export function memberMandateIdAction(row: MemberMandateIdRow) {
  return row.termId === 21 && /^(?!0000)\d{8}$/.test(row.memberBtMdbId ?? '') && row.mandateBtMdbId !== row.memberBtMdbId
    ? row.mandateBtMdbId === null || /^0000\d{4}$/.test(row.mandateBtMdbId) ? 'normalize' : 'conflict'
    : 'keep'
}
