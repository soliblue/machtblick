import { candidateDetailTabLabels, type CandidateDetailTab } from '@/lib/candidateDetailTabs'

type Props = {
  activeTab: CandidateDetailTab | null
  tabs: CandidateDetailTab[]
  onChange: (tab: CandidateDetailTab) => void
}

export function CandidateDetailTabs({ activeTab, tabs, onChange }: Props) {
  return tabs.length ? (
    <nav
      aria-label="Profilbereiche"
      className="mt-l mb-l grid gap-xs rounded-m border border-fg/15 bg-surface p-xs"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          id={`candidate-tab-${tab}`}
          type="button"
          aria-current={tab === activeTab ? 'page' : undefined}
          aria-controls={`candidate-panel-${tab}`}
          aria-label={tab === 'persoenlich' ? 'Persönliches Programm' : candidateDetailTabLabels[tab]}
          onClick={() => onChange(tab)}
          className={
            tab === activeTab
              ? 'min-w-0 bg-background px-s py-s text-center text-s font-semibold opacity-100 shadow-[0_1px_2px_rgba(10,10,10,0.08)]'
              : 'min-w-0 px-s py-s text-center text-s font-regular opacity-l transition-[background,opacity] hover:opacity-100'
          }
          style={{ borderRadius: 'calc(var(--radius-m) - var(--spacing-xs))' }}
        >
          <span className="block truncate">{candidateDetailTabLabels[tab]}</span>
        </button>
      ))}
    </nav>
  ) : null
}
