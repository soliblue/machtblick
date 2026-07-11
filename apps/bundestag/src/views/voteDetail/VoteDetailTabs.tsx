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
  availableTabs: Record<VoteTab, boolean>
  onChange: (t: VoteTab) => void
}

export function VoteDetailTabs({ active, availableTabs, onChange }: Props) {
  const t = useCopy()
  const tabs = TABS
    .filter((tab) => availableTabs[tab.id])
    .map((tab) => ({
      ...tab,
      label:
        tab.id === 'ergebnis' ? t.result
        : tab.id === 'details' ? t.details
        : t.speeches,
    }))
  return (
    <nav
      className="mt-l mb-l grid gap-xs rounded-m border border-fg/15 bg-surface p-xs"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={
              isActive
                ? 'bg-background px-s py-s text-center text-m font-semibold opacity-100 shadow-[0_1px_2px_rgba(10,10,10,0.08)]'
                : 'px-s py-s text-center text-m font-regular opacity-l transition-opacity hover:opacity-100'
            }
            style={{ borderRadius: 'calc(var(--radius-m) - var(--spacing-xs))' }}
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
