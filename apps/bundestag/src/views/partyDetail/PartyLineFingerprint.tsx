import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { PartyVote, PartyVoteRow } from '@/server/partyDetail'
import { useCopy } from '@/lib/i18n'

const SEGMENTS = [
  { key: 'yes', color: 'var(--color-success)' },
  { key: 'no', color: 'var(--color-danger)' },
  { key: 'abstain', color: 'var(--color-yellow)' },
  { key: 'split', color: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' },
] as const

type Props = {
  votes: PartyVoteRow[]
  filter: PartyVote | null
  onFilterChange: (v: PartyVote | null) => void
}

export function PartyLineFingerprint({ votes, filter, onFilterChange }: Props) {
  const t = useCopy()
  const label: Record<PartyVote, string> = {
    yes: t.yes,
    no: t.no,
    abstain: t.abstain,
    split: t.stanceLabels.split,
  }
  const segments = SEGMENTS
    .map((s) => ({ ...s, count: votes.filter((v) => v.partyVote === s.key).length }))
    .filter((s) => s.count > 0)
  return (
    <div className="mb-m">
      <div className="mb-s text-s caption opacity-l">{t.partyLine}</div>
      <div className="flex h-8 w-full gap-[2px]">
        {segments.map((s) => (
          <Tooltip key={s.key}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`${s.count} ${label[s.key]}`}
                aria-pressed={filter === s.key}
                onClick={() => onFilterChange(filter === s.key ? null : s.key)}
                className="h-full transition-opacity"
                style={{
                  flex: `${s.count} 0 0%`,
                  background: s.color,
                  opacity: filter && filter !== s.key ? 'var(--opacity-s)' : 1,
                }}
              />
            </TooltipTrigger>
            <TooltipContent>{s.count} {label[s.key]}</TooltipContent>
          </Tooltip>
        ))}
      </div>
      <div className="mt-s flex flex-wrap items-center gap-x-s gap-y-xs text-s caption">
        {segments.map((s, i) => (
          <span key={s.key} className="inline-flex items-center gap-s">
            <span><span className="font-semibold tabular-nums">{s.count}</span> <span className="opacity-l">{label[s.key]}</span></span>
            {i < segments.length - 1 && <span className="opacity-l" aria-hidden="true">·</span>}
          </span>
        ))}
      </div>
    </div>
  )
}
