import { HONORIFICS, NAME_PARTICLES } from '../_shared/names.ts'

export type MemberMatchRow = {
  id: string
  first: string
  last: string
  btMdbId: string | null
}

export type AwProfile = {
  first_name: string
  last_name: string
  ext_id_bundestagsverwaltung: string | null
}

export function buildMemberMatcher(members: MemberMatchRow[], memberByAwPoliticianId: Map<number, string>, activeMemberIds = new Set<string>()) {
  const memberById = new Map(members.map((member) => [member.id, member]))
  const byMdbId = new Map(members.filter((member) => member.btMdbId).map((member) => [member.btMdbId!, member]))
  const byNameKey = new Map<string, MemberMatchRow[]>()
  for (const member of members) {
    const key = nameKey(firstToken(member.first), member.last)
    byNameKey.set(key, [...(byNameKey.get(key) ?? []), member])
  }

  return (profile: AwProfile, awPoliticianId: number) => {
    const hits = byNameKey.get(nameKey(firstToken(profile.first_name), profile.last_name)) ?? []
    const activeHits = hits.filter((member) => activeMemberIds.has(member.id))
    const mandateMember = memberById.get(memberByAwPoliticianId.get(awPoliticianId) ?? '')
    const mdbMember = profile.ext_id_bundestagsverwaltung ? byMdbId.get(profile.ext_id_bundestagsverwaltung.padStart(8, '0')) : undefined
    if (mandateMember && activeMemberIds.has(mandateMember.id)) return { member: mandateMember, via: 'aw' as const }
    if (activeHits.length === 1) return { member: activeHits[0], via: 'name' as const }
    if (mandateMember) return { member: mandateMember, via: 'aw' as const }
    if (mdbMember && activeMemberIds.has(mdbMember.id)) return { member: mdbMember, via: 'mdb' as const }
    if (mdbMember && hits.length === 1 && hits[0].id !== mdbMember.id) return { member: hits[0], via: 'name' as const }
    if (mdbMember) return { member: mdbMember, via: 'mdb' as const }
    if (hits.length === 1) return { member: hits[0], via: 'name' as const }
    return { member: null, via: 'none' as const, reason: hits.length > 1 ? 'ambiguous' : 'no name hit' }
  }
}

function firstToken(value: string) {
  return strip(value).split(' ')[0] ?? ''
}

function nameKey(first: string, last: string) {
  return strip(`${first} ${last}`)
}

function strip(value: string) {
  return value.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/ı/g, 'i')
    .normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ').filter((token) => token && !HONORIFICS.has(token) && !NAME_PARTICLES.has(token)).join(' ')
}
