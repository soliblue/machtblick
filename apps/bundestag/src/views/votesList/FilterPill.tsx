import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { PARTY_LABEL, PARTY_LOGO } from '@/lib/parties'
import { PartyLogo } from './PartyLogo'

type IconProps = { size?: number; className?: string }
type Props = {
  label: string
  options: string[]
  value: string | null
  onChange: (value: string | null) => void
  formatOption?: (opt: string) => string
  icon?: ComponentType<IconProps>
}

export function FilterPill({ label, options, value, onChange, formatOption, icon: Icon }: Props) {
  const fmt = (opt: string) => formatOption?.(opt) ?? PARTY_LABEL[opt] ?? opt
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
  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex shrink-0 items-center gap-s border px-m py-xs text-m transition-colors hover:bg-surface"
        style={{
          borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)',
          background: value ? 'var(--color-surface)' : 'transparent',
        }}
      >
        {value && PARTY_LOGO[value] ? (
          <PartyLogo party={value} size={14} />
        ) : Icon ? (
          <Icon size={14} className="opacity-l" />
        ) : null}
        {value ? <span className="font-semibold">{fmt(value)}</span> : <span>{label}</span>}
        {value && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
            className="opacity-l hover:opacity-100"
          >
            ×
          </span>
        )}
      </button>
      {open && pos && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 flex min-w-[180px] flex-col bg-background p-xs shadow-lg"
          style={{ left: pos.left, top: pos.top, border: '1px solid color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt === value ? null : opt)
                setOpen(false)
              }}
              className="flex items-center gap-s px-s py-xs text-left text-m hover:bg-surface"
              style={{ background: opt === value ? 'var(--color-surface)' : 'transparent' }}
            >
              {PARTY_LOGO[opt] && <PartyLogo party={opt} size={14} />}
              <span>{fmt(opt)}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}
