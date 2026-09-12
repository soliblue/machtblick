export function resolveMandateMember(
  awPoliticianId: number,
  mdbId: string | null,
  memberIdByAwPoliticianId: Map<number, string>,
  memberIdByMdbId: Map<string, string>,
  btMdbIdByMemberId: Map<string, string | null>,
  resolveName: () => string,
) {
  const memberId = memberIdByAwPoliticianId.get(awPoliticianId) ?? (mdbId ? memberIdByMdbId.get(mdbId) : null) ?? resolveName()
  return { memberId, btMdbId: btMdbIdByMemberId.get(memberId) ?? mdbId }
}
