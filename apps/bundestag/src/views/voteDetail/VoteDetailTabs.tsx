import type { VoteTab } from './VoteDetail'
import { useCopy } from '@/lib/i18n'

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
  const t = useCopy()
  const tabs = TABS
    .map((tab) => ({
      ...tab,
      label:
        tab.id === 'ergebnis' ? t.result
        : tab.id === 'details' ? t.details
        : t.speeches,
    }))
  return (
    <nav
      className="-mx-l mt-l mb-l grid border-y"
      style={{ borderColor: border, gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab, i) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={
              isActive
                ? '-mb-px py-m text-center text-l font-semibold opacity-100 border-b-2 border-fg bg-surface'
                : '-mb-px border-b-2 border-transparent py-m text-center text-l font-regular opacity-l transition-opacity hover:opacity-100'
            }
            style={i > 0 ? { borderLeft: `1px solid ${border}` } : undefined}
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
