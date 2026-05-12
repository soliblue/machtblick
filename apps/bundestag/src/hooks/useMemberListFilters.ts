import { useMemo, useState } from 'react'
import type { MemberListItem } from '@/server/members'

export type MemberSortKey = 'name' | 'party' | 'state' | 'attendance' | 'loyalty'
export type SortDir = 'asc' | 'desc'

export function useMemberListFilters(
  members: MemberListItem[],
  party: string | null,
  state: string | null,
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
  const filtered = useMemo(() => {
    const base = members.filter((m) => (!party || m.party === party) && (!state || m.state === state))
    const dir = sortDir === 'asc' ? 1 : -1
    return [...base].sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv), 'de') * dir
    })
  }, [members, party, state, sortKey, sortDir])
  const toggleSort = (key: MemberSortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'attendance' || key === 'loyalty' ? 'desc' : 'asc')
    }
  }
  return { filtered, availableParties, availableStates, sortKey, sortDir, toggleSort }
}
