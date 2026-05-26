import type { VoteListItem } from '@/server/votes'
import { formatDate } from '@/lib/format'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'
import { PartyBadge } from './PartyBadge'
import { Stamp } from './Stamp'
import { deriveStamps } from './deriveStamps'
import { VoteDistributionDonut } from './VoteDistributionDonut'

type Props = { vote: VoteListItem }

export function VoteRow({ vote }: Props) {
  const stamps = deriveStamps(vote)
  const heading = vote.cleanTitle
  const locale = useLocale()
  const t = useCopy()
  const typeLabels: Record<VoteListItem['voteType'], string> = {
    namentlich: t.namedVote,
    handzeichen: t.showOfHands,
    hammelsprung: t.division,
  }
  return (
    <div className="relative py-xl first:pt-xs before:absolute before:inset-x-xs before:top-0 before:h-[1.5px] before:rounded-full before:bg-elevated before:content-[''] first:before:hidden">
      <a
        href={withLocale(`/votes/${vote.id}/`, locale)}
        className="absolute inset-0"
        aria-label={heading}
      />
      <div className="flex flex-wrap items-center gap-s text-s uppercase opacity-l" style={{ letterSpacing: '0.08em' }}>
        <PartyBadge party={vote.proposingParty} />
        <span>·</span>
        <span>{formatDate(vote.date)}</span>
        <span>·</span>
        <span>{typeLabels[vote.voteType]}</span>
      </div>
      <div className="mt-s grid grid-cols-[auto_1fr] items-center gap-x-m gap-y-s sm:gap-x-l">
        <div className="row-span-2 shrink-0 [&_svg]:!h-[80px] [&_svg]:!w-[80px] sm:[&_svg]:!h-[144px] sm:[&_svg]:!w-[144px]">
          <VoteDistributionDonut yes={vote.yes} no={vote.no} abstain={vote.abstain} absent={vote.absent} size={80} />
        </div>
        <div
          lang={locale}
          className="font-display text-[18px] leading-snug sm:text-[21px]"
          style={{ fontWeight: 500, hyphens: 'auto', overflowWrap: 'break-word', wordBreak: 'normal' }}
        >
          {heading}
        </div>
        <div className="col-start-2 flex flex-wrap items-center justify-start gap-s pb-xs">
          {stamps.map((s) => (
            <Stamp key={s} variant={s} />
          ))}
        </div>
      </div>
    </div>
  )
}
