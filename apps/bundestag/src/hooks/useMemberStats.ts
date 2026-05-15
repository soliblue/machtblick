import { useMemo } from 'react'
import type { MemberListItem, MemberSex } from '@/server/members'
import { AGE_BUCKETS, AGE_BUCKET_LABEL, SEX_LABEL, ageBucketFor, type AgeBucket } from '@/lib/ageBuckets'
import { PARTY_COLOR, partyLabel } from '@/lib/parties'
import { useLocale } from '@/lib/i18n'

export type MemberStats = {
  gender: Array<{ key: MemberSex | 'unbekannt'; label: string; count: number }>
  age: Array<{ key: AgeBucket; label: string; count: number }>
  party: Array<{ key: string; label: string; color: string; count: number }>
}

const SEX_KEYS: Array<MemberSex | 'unbekannt'> = ['m', 'f', 'd', 'unbekannt']

const SEX_LABEL_WITH_UNKNOWN: Record<MemberSex | 'unbekannt', string> = {
  ...SEX_LABEL,
  unbekannt: 'Unbekannt',
}

export function useMemberStats(members: MemberListItem[]): MemberStats {
  const locale = useLocale()
  return useMemo(() => {
    const genderCounts: Record<MemberSex | 'unbekannt', number> = { m: 0, f: 0, d: 0, unbekannt: 0 }
    const ageCounts: Record<AgeBucket, number> = {
      'unter-30': 0,
      '30-39': 0,
      '40-49': 0,
      '50-59': 0,
      '60-69': 0,
      '70-plus': 0,
    }
    const partyCounts = new Map<string, number>()
    for (const m of members) {
      const sexKey: MemberSex | 'unbekannt' = m.sex ?? 'unbekannt'
      genderCounts[sexKey] += 1
      const bucket = ageBucketFor(m.yearOfBirth)
      if (bucket) ageCounts[bucket] += 1
      if (m.party) partyCounts.set(m.party, (partyCounts.get(m.party) ?? 0) + 1)
    }
    const gender = SEX_KEYS
      .filter((k) => genderCounts[k] > 0)
      .map((k) => ({ key: k, label: SEX_LABEL_WITH_UNKNOWN[k], count: genderCounts[k] }))
      .sort((a, b) => b.count - a.count)
    const age = AGE_BUCKETS.map((k) => ({ key: k, label: AGE_BUCKET_LABEL[k], count: ageCounts[k] }))
    const party = Array.from(partyCounts.entries())
      .map(([key, count]) => ({
        key,
        label: partyLabel(key, locale),
        color: PARTY_COLOR[key] ?? 'var(--color-fg)',
        count,
      }))
      .sort((a, b) => b.count - a.count)
    return { gender, age, party }
  }, [locale, members])
}
