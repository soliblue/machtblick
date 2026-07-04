import { VOTE_SEGMENTS, type VoteChoice } from '@/views/votesList/VoteDistributionDonut'
import { useCopy } from '@/lib/i18n'

type Props = {
  yes: number
  no: number
  abstain: number
  absent: number
  selected: VoteChoice | null
  onSelect: (choice: VoteChoice) => void
}

export function VoteCountsRow({ yes, no, abstain, absent, selected, onSelect }: Props) {
  const t = useCopy()
  const values = { yes, no, abstain, absent }
  const labels = { yes: t.yes, no: t.no, abstain: t.abstention, absent: t.absent }
  return (
    <div className="mb-l flex flex-wrap items-center gap-x-l gap-y-s">
      {VOTE_SEGMENTS.map((s) => (
        <button
          key={s.key}
          type="button"
          onClick={() => onSelect(s.key)}
          aria-pressed={selected === s.key}
          className="flex items-center gap-s transition-opacity"
          style={{ opacity: selected && selected !== s.key ? 0.4 : 1 }}
        >
          <span className="inline-block size-[10px] shrink-0" style={{ background: s.color }} />
          <span className="text-m">{labels[s.key]}</span>
          <span className="text-m font-semibold">{values[s.key]}</span>
        </button>
      ))}
    </div>
  )
}
