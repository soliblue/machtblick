import { VOTE_TABS, type VoteTab } from './VoteDetail'
import { useCopy } from '@/lib/i18n'

type Props = {
  active: VoteTab
  availableTabs: Record<VoteTab, boolean>
  onChange: (t: VoteTab) => void
}

export function VoteDetailTabs({ active, availableTabs, onChange }: Props) {
  const t = useCopy()
  const labels: Record<VoteTab, string> = { ergebnis: t.result, details: t.details, reden: t.speeches }
  const tabs = VOTE_TABS.filter((tab) => availableTabs[tab])
  return (
    <nav
      className="mt-l mb-l grid gap-xs rounded-m border border-fg/15 bg-surface p-xs"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab) => {
        const isActive = tab === active
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={
              isActive
                ? 'bg-background px-s py-s text-center text-m font-semibold opacity-100 shadow-[0_1px_2px_rgba(10,10,10,0.08)]'
                : 'px-s py-s text-center text-m font-regular opacity-l transition-opacity hover:opacity-100'
            }
            style={{ borderRadius: 'calc(var(--radius-m) - var(--spacing-xs))' }}
          >
            {labels[tab]}
          </button>
        )
      })}
    </nav>
  )
}
