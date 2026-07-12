import { useEffect, useRef, useState } from 'react'
import { Filter } from 'lucide-react'
import { useCopy } from '@/lib/i18n'

const HAIR = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

export type FilterSheetGroup = {
  key: string
  label: string
  options: string[]
  value: string | null
  onChange: (value: string | null) => void
  format: (opt: string) => string
  searchable?: boolean
}

export type FilterSheetSort = {
  label: string
  options: { key: string; label: string }[]
  value: string
  dir: 'asc' | 'desc'
  onSelect: (key: string) => void
}

type Props = { groups: FilterSheetGroup[]; activeCount: number; sort?: FilterSheetSort }

export function FilterSheet({ groups, activeCount, sort }: Props) {
  const t = useCopy()
  const [open, setOpen] = useState(false)
  const [queries, setQueries] = useState<Record<string, string>>({})
  const [dragY, setDragY] = useState(0)
  const startY = useRef(0)
  const fabRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const close = () => {
    setOpen(false)
    setDragY(0)
  }
  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return
    panel.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        return
      }
      if (e.key !== 'Tab') return
      const items = panel.querySelectorAll<HTMLElement>('button:not([disabled]), input, select, textarea, a[href]')
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      fabRef.current?.focus()
    }
  }, [open])
  return (
    <>
      <button
        ref={fabRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`fixed left-1/2 z-30 flex -translate-x-1/2 items-center gap-s rounded-full bg-fg px-l py-s text-m text-background shadow-[0_2px_8px_rgba(10,10,10,0.2),0_8px_24px_rgba(10,10,10,0.18)] ${activeCount > 0 ? 'font-semibold' : ''}`}
        style={{ bottom: 'calc(16px + env(safe-area-inset-bottom))' }}
      >
        <Filter size={14} className="shrink-0" aria-hidden="true" />
        {t.filterLabel}
        {activeCount > 0 && ` · ${activeCount}`}
      </button>
      {open && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={t.filterLabel}>
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div
            ref={panelRef}
            tabIndex={-1}
            className="absolute inset-x-0 bottom-0 max-h-[75svh] overflow-y-auto rounded-t-m border-t bg-background px-l outline-none"
            style={{
              borderColor: HAIR,
              paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
              transform: `translateY(${dragY}px)`,
              transition: dragY === 0 ? 'transform 0.15s ease-out' : 'none',
            }}
            onTouchStart={(e) => {
              startY.current = e.touches[0].clientY
            }}
            onTouchMove={(e) => setDragY(Math.max(0, e.touches[0].clientY - startY.current))}
            onTouchEnd={() => (dragY > 80 ? close() : setDragY(0))}
          >
            <div className="flex justify-center py-m">
              <div className="h-[4px] w-[40px] bg-fg/15" />
            </div>
            {groups.map((g) => {
              const query = (queries[g.key] ?? '').trim().toLowerCase()
              const visible = g.searchable
                ? g.options.filter((opt) => opt === g.value || g.format(opt).toLowerCase().includes(query)).slice(0, 20)
                : g.options
              return (
                <div key={g.key} className="mb-l">
                  <p className="mb-s text-s caption opacity-l">
                    {g.label}
                  </p>
                  {g.searchable && (
                    <input
                      type="search"
                      value={queries[g.key] ?? ''}
                      onChange={(e) => setQueries((q) => ({ ...q, [g.key]: e.target.value }))}
                      placeholder={g.label}
                      aria-label={g.label}
                      className="mb-s w-full rounded-m border bg-transparent px-s py-xs text-m outline-none focus:border-fg"
                      style={{ borderColor: HAIR }}
                    />
                  )}
                  <div className="flex flex-wrap gap-s">
                    {visible.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => g.onChange(opt === g.value ? null : opt)}
                        className={`rounded-m border px-m py-s text-m ${opt === g.value ? 'bg-surface font-semibold' : ''}`}
                        style={{ borderColor: HAIR }}
                      >
                        {g.format(opt)}
                        {opt === g.value && <span className="ml-s opacity-l">×</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
            {sort && (
              <div className="mb-l">
                <p className="mb-s text-s caption opacity-l">
                  {sort.label}
                </p>
                <div className="flex flex-wrap gap-s">
                  {sort.options.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => sort.onSelect(o.key)}
                      className={`rounded-m border px-m py-s text-m ${o.key === sort.value ? 'bg-surface font-semibold' : ''}`}
                      style={{ borderColor: HAIR }}
                    >
                      {o.label}
                      {o.key === sort.value && <span className="ml-s">{sort.dir === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
