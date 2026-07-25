import { HONORIFICS } from '../_shared/names.ts'

export type DipMemberCandidate = {
  id: string
  name: string
  firstName: string
  lastName: string
  dipPersonId: number | null
}

export function buildDipMemberResolver(members: DipMemberCandidate[]) {
  const byDipId = new Map<number, string>()
  const byName = new Map<string, Set<string>>()
  for (const member of members) {
    if (member.dipPersonId !== null) byDipId.set(member.dipPersonId, member.id)
    for (const label of new Set([member.name, `${member.firstName} ${member.lastName}`])) {
      const key = nameKey(label)
      const ids = byName.get(key) ?? new Set<string>()
      ids.add(member.id)
      byName.set(key, ids)
    }
  }
  return (dipPersonId: number, activityTitle = '') => {
    const ids = byName.get(nameKey(activityTitle))
    return byDipId.get(dipPersonId) ?? (ids?.size === 1 ? ids.values().next().value ?? null : null)
  }
}

function nameKey(value: string) {
  return value
    .split(',')[0]
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^a-z0-9]+/)
    .filter((token) => token && !HONORIFICS.has(token))
    .join(' ')
}
