import { useMemo, useState } from 'react'
import type { MandateType, MemberListItem, MemberSex } from '@/server/members'
import { AGE_BUCKETS, ageBucketFor, isAgeBucket, isMandateType, isSex, type AgeBucket } from '@/lib/ageBuckets'

export type MemberSortKey = 'name' | 'attendance' | 'loyalty'
export type SortDir = 'asc' | 'desc'

export function useMemberListFilters(
  members: MemberListItem[],
  party: string | null,
  state: string | null,
  sex: MemberSex | null,
  ageBucket: AgeBucket | null,
  mandateType: MandateType | null,
  query: string = '',
) {
  const [sortKey, setSortKey] = useState<MemberSortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const availableParties = useMemo(() => {
    const set = new Set<string>()
    for (const m of members) if (m.party) set.add(m.party)
    return Array.from(set).sort()
  }, [members])
  const availableStates = useMemo(() => {
    const set = new Set<string>()
    for (const m of members) if (m.state) set.add(m.state)
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'de'))
  }, [members])
  const availableSexes = useMemo(() => {
    const set = new Set<MemberSex>()
    for (const m of members) if (isSex(m.sex)) set.add(m.sex)
    return Array.from(set)
  }, [members])
  const availableAgeBuckets = useMemo(() => {
    const set = new Set<AgeBucket>()
    for (const m of members) {
      const b = ageBucketFor(m.yearOfBirth)
      if (b) set.add(b)
    }
    return AGE_BUCKETS.filter((b) => set.has(b))
  }, [members])
  const availableMandateTypes = useMemo(() => {
    const set = new Set<MandateType>()
    for (const m of members) if (isMandateType(m.mandateType)) set.add(m.mandateType)
    return Array.from(set)
  }, [members])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = members.filter((m) => {
      if (q && !m.name.toLowerCase().includes(q)) return false
      if (party && m.party !== party) return false
      if (state && m.state !== state) return false
      if (sex && m.sex !== sex) return false
      if (ageBucket && (!isAgeBucket(ageBucket) || ageBucketFor(m.yearOfBirth) !== ageBucket)) return false
      if (mandateType && m.mandateType !== mandateType) return false
      return true
    })
    const dir = sortDir === 'asc' ? 1 : -1
    return [...base].sort((a, b) => {
      const av = sortKey === 'name' ? `${a.lastName} ${a.name}` : a[sortKey]
      const bv = sortKey === 'name' ? `${b.lastName} ${b.name}` : b[sortKey]
      if (av === null && bv === null) return 0
      if (av === null) return 1
      if (bv === null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv), 'de') * dir
    })
  }, [members, party, state, sex, ageBucket, mandateType, query, sortKey, sortDir])
  const toggleSort = (key: MemberSortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'attendance' || key === 'loyalty' ? 'desc' : 'asc')
    }
  }
  return {
    filtered,
    availableParties,
    availableStates,
    availableSexes,
    availableAgeBuckets,
    availableMandateTypes,
    sortKey,
    sortDir,
    toggleSort,
  }
}
