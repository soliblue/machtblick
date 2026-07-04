import { useRef, useState } from 'react'
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
}

type Props = { groups: FilterSheetGroup[]; activeCount: number }

export function FilterSheet({ groups, activeCount }: Props) {
  const t = useCopy()
  const [open, setOpen] = useState(false)
  const [dragY, setDragY] = useState(0)
  const startY = useRef(0)
  const close = () => {
    setOpen(false)
    setDragY(0)
  }
  return (
    <>
      <button
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
          <div className="absolute inset-0 bg-fg/40" onClick={close} />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[75svh] overflow-y-auto border-t bg-background px-l"
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
            {groups.map((g) => (
              <div key={g.key} className="mb-l">
                <p className="mb-s text-s caption opacity-l">
                  {g.label}
                </p>
                <div className="flex flex-wrap gap-s">
                  {g.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => g.onChange(opt === g.value ? null : opt)}
                      className={`border px-m py-s text-m ${opt === g.value ? 'bg-surface font-semibold' : ''}`}
                      style={{ borderColor: HAIR }}
                    >
                      {g.format(opt)}
                      {opt === g.value && <span className="ml-s opacity-l">×</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
