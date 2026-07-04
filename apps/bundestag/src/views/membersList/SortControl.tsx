import { useEffect, useRef, useState } from 'react'
import type { MemberSortKey, SortDir } from '@/hooks/useMemberListFilters'
import { useCopy } from '@/lib/i18n'

const HAIR = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

type Props = { sortKey: MemberSortKey; sortDir: SortDir; onSort: (key: MemberSortKey) => void }

export function SortControl({ sortKey, sortDir, onSort }: Props) {
  const t = useCopy()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  const labels: Record<MemberSortKey, string> = { name: t.name, attendance: t.attendance, loyalty: t.line }
  const arrow = sortDir === 'asc' ? '↑' : '↓'
  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t.sortBy} ${labels[sortKey]}, ${sortDir === 'asc' ? t.ascending : t.descending}`}
        className="inline-flex items-center gap-s border bg-surface px-m py-xs text-m"
        style={{ borderColor: HAIR }}
      >
        <span className="opacity-l">{t.sortLabel}</span>
        <span className="font-semibold">{labels[sortKey]} {arrow}</span>
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-30 mt-xs flex min-w-[180px] flex-col bg-background p-xs shadow-lg"
          style={{ border: `1px solid ${HAIR}` }}
        >
          {(Object.keys(labels) as MemberSortKey[]).map((k) => (
            <button
              key={k}
              type="button"
              role="option"
              aria-selected={k === sortKey}
              onClick={() => {
                onSort(k)
                setOpen(false)
              }}
              className="flex items-center justify-between gap-s px-s py-xs text-left text-m hover:bg-surface"
              style={{ background: k === sortKey ? 'var(--color-surface)' : 'transparent' }}
            >
              <span>{labels[k]}</span>
              {k === sortKey && <span className="opacity-l">{arrow}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
