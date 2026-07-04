import { PARTY_LOGO, PARTY_SLUG, partyLabel } from '@/lib/parties'
import { partiesByJaShare } from '@/views/votesList/deriveDek'
import { PartyLogo } from '@/views/votesList/PartyLogo'
import { VoteDistributionDonut, type VoteChoice } from '@/views/votesList/VoteDistributionDonut'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

type Summary = {
  party: string
  position: 'yes' | 'no' | 'abstain' | 'mixed'
  members: number
  yes: number
  no: number
  abstain: number
  absent: number
}

type Props = { summaries: Summary[]; selected?: VoteChoice | null }

const VALUE_COLOR: Record<VoteChoice, string> = {
  yes: 'var(--color-success)',
  no: 'var(--color-danger)',
  abstain: 'var(--color-yellow)',
  absent: 'color-mix(in oklab, var(--color-fg) 40%, transparent)',
}

export function PartyDonutGrid({ summaries, selected = null }: Props) {
  const t = useCopy()
  const locale = useLocale()
  const shortLabel: Record<VoteChoice, string> = { yes: t.yes, no: t.no, abstain: t.abstainShort, absent: t.absentShort }
  const fullLabel: Record<VoteChoice, string> = { yes: t.yes, no: t.no, abstain: t.abstention, absent: t.absentLabel }
  return (
    <TooltipProvider delayDuration={50}>
      <div className="grid grid-cols-3 gap-l desk:flex desk:justify-between">
        {partiesByJaShare(summaries).map((p) => {
          const label = partyLabel(p.party, locale)
          const counts: Array<[VoteChoice, number]> = [['yes', p.yes], ['no', p.no], ['abstain', p.abstain], ['absent', p.absent]]
          return (
            <div key={p.party} className="flex min-w-0 flex-col items-center gap-xs">
              <Tooltip>
                <TooltipTrigger asChild>
                  <a href={withLocale(`/parties/${PARTY_SLUG[p.party] ?? p.party}/votes/`, locale)} aria-label={label}>
                    <VoteDistributionDonut yes={p.yes} no={p.no} abstain={p.abstain} absent={p.absent} size={72} selected={selected} />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="font-semibold">{label}</div>
                  {counts.map(([choice, value]) => (
                    <div key={choice} className="capitalize opacity-l">{fullLabel[choice]} {value}</div>
                  ))}
                </TooltipContent>
              </Tooltip>
              {PARTY_LOGO[p.party] ? (
                <PartyLogo party={p.party} size={16} />
              ) : (
                <span
                  className={`max-w-full truncate text-s uppercase ${p.position === 'mixed' ? 'font-semibold' : 'opacity-l'}`}
                  style={{ letterSpacing: '0.06em' }}
                >
                  {label}
                </span>
              )}
              <div className="flex flex-col items-center text-s tabular-nums">
                {counts.filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([choice, value]) => (
                  <span key={choice}>
                    <span className="opacity-l">{shortLabel[choice]}</span>{' '}
                    <span style={{ color: VALUE_COLOR[choice] }}>{value}</span>
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
