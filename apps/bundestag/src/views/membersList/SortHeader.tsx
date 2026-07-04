import type { MemberSortKey, SortDir } from '@/hooks/useMemberListFilters'
import { useCopy } from '@/lib/i18n'

type Props = {
  label: string
  k: MemberSortKey
  sortKey: MemberSortKey
  sortDir: SortDir
  onSort: (key: MemberSortKey) => void
  width?: string
  align?: 'left' | 'right'
  labelClass?: string
}

export function SortHeader({ label, k, sortKey, sortDir, onSort, width, align = 'left', labelClass }: Props) {
  const active = sortKey === k
  const arrow = active ? (sortDir === 'asc' ? '↑' : '↓') : ''
  const t = useCopy()
  return (
    <button
      type="button"
      onClick={() => onSort(k)}
      aria-label={`${t.sortBy} ${label}${active ? (sortDir === 'asc' ? `, ${t.ascending}` : `, ${t.descending}`) : ''}`}
      className={`flex items-center gap-xs hover:opacity-100 ${width ?? ''} ${align === 'right' ? 'justify-end' : ''}`}
      style={{ opacity: active ? 1 : undefined, fontWeight: active ? 600 : undefined }}
    >
      <span className={labelClass}>{label}</span> {arrow}
    </button>
  )
}
