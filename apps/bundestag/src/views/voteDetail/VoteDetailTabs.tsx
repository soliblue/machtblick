import type { VoteTab } from './VoteDetail'

type Tab = { id: VoteTab; label: string }

const TABS: Tab[] = [
  { id: 'ergebnis', label: 'Ergebnis' },
  { id: 'details', label: 'Details' },
  { id: 'reden', label: 'Reden' },
]

type Props = {
  active: VoteTab
  onChange: (t: VoteTab) => void
}

export function VoteDetailTabs({ active, onChange }: Props) {
  const border = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'
  return (
    <nav
      className="-mx-l mt-l mb-l grid grid-cols-3 border-y"
      style={{ borderColor: border }}
    >
      {TABS.map((t, i) => {
        const isActive = t.id === active
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={
              isActive
                ? '-mb-px py-m text-center text-l font-semibold opacity-100 border-b-2 border-fg bg-surface'
                : '-mb-px border-b-2 border-transparent py-m text-center text-l font-regular opacity-l transition-opacity hover:opacity-100'
            }
            style={i > 0 ? { borderLeft: `1px solid ${border}` } : undefined}
          >
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}
