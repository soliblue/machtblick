import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MemberOption } from '@/server/speeches'

type Props = {
  label: string
  options: MemberOption[]
  value: string | null
  onChange: (id: string | null) => void
}

const BORDER = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

export function MemberFilterPill({ label, options, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return
    const r = buttonRef.current.getBoundingClientRect()
    setPos({ left: r.left, top: r.bottom + 4 })
  }, [open])
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      const t = e.target as Node
      if (buttonRef.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
      setOpen(false)
    }
    const onScroll = () => setOpen(false)
    document.addEventListener('mousedown', close)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open])
  const selected = useMemo(() => options.find((o) => o.id === value) ?? null, [options, value])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options.slice(0, 50)
    return options.filter((o) => o.name.toLowerCase().includes(q)).slice(0, 50)
  }, [options, query])
  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex shrink-0 items-center gap-s rounded-m border px-m py-xs text-m transition-colors hover:bg-surface"
        style={{ borderColor: BORDER, background: value ? 'var(--color-surface)' : 'transparent' }}
      >
        {selected ? <span className="font-semibold">{selected.name}</span> : <span>{label}</span>}
        {value && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Filter zurücksetzen"
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onChange(null) } }}
            className="opacity-l hover:opacity-100"
          >
            ×
          </span>
        )}
      </button>
      {open && pos && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          className="fixed z-50 flex w-[260px] flex-col overflow-hidden rounded-m bg-background p-xs shadow-lg"
          style={{ left: pos.left, top: pos.top, border: `1px solid ${BORDER}` }}
        >
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen"
            aria-label="Abgeordnete suchen"
            className="mb-xs w-full rounded-m border bg-transparent px-s py-xs text-m outline-none focus:border-fg"
            style={{ borderColor: BORDER }}
          />
          <div className="max-h-[320px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-s py-xs text-s opacity-l">Keine Treffer</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  role="option"
                  aria-selected={o.id === value}
                  onClick={() => {
                    onChange(o.id === value ? null : o.id)
                    setOpen(false)
                  }}
                  className="block w-full rounded-m px-s py-xs text-left text-m hover:bg-surface"
                  style={{ background: o.id === value ? 'var(--color-surface)' : 'transparent' }}
                >
                  {o.name}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
