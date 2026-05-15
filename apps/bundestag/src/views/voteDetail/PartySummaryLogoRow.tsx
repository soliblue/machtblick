import { useMemo, useState } from 'react'
import { PARTY_LABEL, PARTY_LOGO, PARTY_ORDER } from '@/lib/parties'
import { PartyLogo } from '@/views/votesList/PartyLogo'
import { PartySummaryModal, type PartySummary } from './PartySummaryModal'

type Props = {
  summaries: PartySummary[]
}

export function PartySummaryLogoRow({ summaries }: Props) {
  const [active, setActive] = useState<PartySummary | null>(null)
  const available = useMemo(() => {
    const byParty = new Map(summaries.filter((s) => s.positionSummary).map((s) => [s.party, s]))
    const ordered = PARTY_ORDER.map((p) => byParty.get(p)).filter((s): s is PartySummary => Boolean(s))
    const seen = new Set(ordered.map((s) => s.party))
    return [...ordered, ...summaries.filter((s) => s.positionSummary && !seen.has(s.party))]
  }, [summaries])
  if (available.length === 0) return null
  return (
    <div className="mb-m flex flex-wrap items-center gap-s">
      {available.map((s) => (
        <button
          key={s.party}
          type="button"
          onClick={() => setActive(s)}
          aria-label={`Zusammenfassung ${PARTY_LABEL[s.party] ?? s.party}`}
          className="px-s py-xs opacity-l transition-opacity hover:opacity-100"
        >
          {PARTY_LOGO[s.party]
            ? <PartyLogo party={s.party} size={22} decorative />
            : <span className="text-s font-semibold">{PARTY_LABEL[s.party] ?? s.party}</span>}
        </button>
      ))}
      {active && <PartySummaryModal summary={active} onClose={() => setActive(null)} />}
    </div>
  )
}
