import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { MemberVoteRow } from '@/server/memberDetail'
import { useCopy } from '@/lib/i18n'

const SEGMENTS = [
  { key: 'ja', color: 'var(--color-success)' },
  { key: 'nein', color: 'var(--color-danger)' },
  { key: 'enthalten', color: 'var(--color-yellow)' },
  { key: 'nicht_abgegeben', color: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' },
] as const

type Props = {
  history: MemberVoteRow[]
  choiceFilter: string | null
  setChoiceFilter: (v: string | null) => void
}

export function ChoiceFingerprintBar({ history, choiceFilter, setChoiceFilter }: Props) {
  const t = useCopy()
  const label: Record<MemberVoteRow['choice'], string> = {
    ja: t.yes,
    nein: t.no,
    enthalten: t.abstain,
    nicht_abgegeben: t.absent,
  }
  const segments = SEGMENTS
    .map((s) => ({ ...s, count: history.filter((r) => r.choice === s.key).length }))
    .filter((s) => s.count > 0)
  return (
    <div className="mb-m">
      <div className="mb-s text-s caption opacity-l">{t.votingBehavior}</div>
      <div className="flex h-8 w-full gap-[2px]">
        {segments.map((s) => (
          <Tooltip key={s.key}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`${s.count} ${label[s.key]}`}
                aria-pressed={choiceFilter === s.key}
                onClick={() => setChoiceFilter(choiceFilter === s.key ? null : s.key)}
                className="h-full transition-opacity"
                style={{
                  flex: `${s.count} 0 0%`,
                  background: s.color,
                  opacity: choiceFilter && choiceFilter !== s.key ? 'var(--opacity-s)' : 1,
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
