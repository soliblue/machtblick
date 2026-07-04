import { useMemo } from 'react'
import type { AntragListItem } from '@/server/antraege'
import { isLaenderInitiative } from '@/lib/bundeslaender'
import { motionStatusBucket, type MotionStatusBucket } from '@/lib/motionStatus'

export type AntragTypeFilter = AntragListItem['type']

export const MOTION_STATUS_BUCKETS: MotionStatusBucket[] = ['angenommen', 'abgelehnt', 'im-verfahren', 'nicht-beraten']

export function antragProposerKey(initiativeFraktion: string | null): string {
  return isLaenderInitiative(initiativeFraktion) ? 'Länder' : initiativeFraktion?.trim() ? initiativeFraktion : 'Sonstige'
}

export function useAntragListFilters(
  items: AntragListItem[],
  type: AntragTypeFilter | null,
  proposer: string | null,
  status: MotionStatusBucket | null,
) {
  const availableProposers = useMemo(
    () => Array.from(new Set(items.map((a) => antragProposerKey(a.initiativeFraktion)))).sort((a, b) => a.localeCompare(b, 'de')),
    [items],
  )
  const filtered = useMemo(() => items.filter((a) => {
    if (type && a.type !== type) return false
    if (proposer && antragProposerKey(a.initiativeFraktion) !== proposer) return false
    if (status && motionStatusBucket(a.beratungsstand) !== status) return false
    return true
  }), [items, type, proposer, status])
  return { filtered, availableProposers }
}
