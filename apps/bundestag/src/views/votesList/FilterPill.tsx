import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PARTY_LOGO, partyLabel } from '@/lib/parties'
import { PartyLogo } from './PartyLogo'
import { useCopy, useLocale } from '@/lib/i18n'

type Props = {
  label: string
  options: string[]
  value: string | null
  onChange: (value: string | null) => void
  formatOption?: (opt: string) => string
  inactiveValue?: string
}

export function FilterPill({ label, options, value, onChange, formatOption, inactiveValue }: Props) {
  const t = useCopy()
  const locale = useLocale()
  const fmt = (opt: string) => formatOption?.(opt) ?? partyLabel(opt, locale)
  const active = value !== null && value !== inactiveValue
  const [open, setOpen] = useState(false)
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
    const onScroll = (e: Event) => {
      if (e.target instanceof HTMLElement && e.target.contains(buttonRef.current)) return
      setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open])
  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="relative inline-flex shrink-0 items-center gap-s rounded-m border px-m py-xs text-m transition-colors before:absolute before:inset-x-0 before:-inset-y-s before:content-[''] hover:bg-surface"
        style={{
          borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)',
          background: active ? 'var(--color-surface)' : 'transparent',
        }}
      >
        {value && PARTY_LOGO[value] ? <PartyLogo party={value} size={14} decorative /> : null}
        {value ? <span className="font-semibold">{fmt(value)}</span> : <span>{label}</span>}
        {active && (
          <span
            role="button"
            tabIndex={0}
            aria-label={t.resetFilter}
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onChange(null) } }}
            className="relative z-10 opacity-l hover:opacity-100"
          >
            ×
          </span>
        )}
      </button>
      {open && pos && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          className="fixed z-50 flex min-w-[180px] flex-col overflow-hidden rounded-m bg-background p-xs shadow-lg"
          style={{ left: pos.left, top: pos.top, border: '1px solid color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              role="option"
              aria-selected={opt === value}
              onClick={() => {
                onChange(opt === value ? null : opt)
                setOpen(false)
              }}
              className="flex items-center gap-s rounded-m px-s py-xs text-left text-m hover:bg-surface"
              style={{ background: opt === value ? 'var(--color-surface)' : 'transparent' }}
            >
              {PARTY_LOGO[opt] && <PartyLogo party={opt} size={14} decorative />}
              <span>{fmt(opt)}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}
