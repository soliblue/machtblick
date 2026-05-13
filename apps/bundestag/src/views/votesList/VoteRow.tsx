import { Link } from '../../lib/Link'
import type { VoteListItem } from '@/server/votes'
import { formatDate } from '@/lib/format'
import { PartyBadge } from './PartyBadge'
import { Stamp } from './Stamp'
import { deriveStamps } from './deriveStamps'
import { VoteDistributionDonut } from './VoteDistributionDonut'
import { VoteTitle } from './VoteTitle'

const VOTE_TYPE_LABEL: Record<VoteListItem['voteType'], string> = {
  namentlich: 'Namentlich',
  handzeichen: 'Handzeichen',
  hammelsprung: 'Hammelsprung',
}

type Props = { vote: VoteListItem }

export function VoteRow({ vote }: Props) {
  const stamps = deriveStamps(vote)
  return (
    <div
      className="relative border-t py-m first:border-t-0 sm:py-l"
      style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
    >
      <Link
        to="/votes/$id/"
        params={{ id: vote.id }}
        className="absolute inset-0"
        aria-label={vote.title}
      />
      <div className="flex flex-wrap items-center gap-s text-s uppercase opacity-l" style={{ letterSpacing: '0.08em' }}>
        <PartyBadge party={vote.proposingParty} />
        <span>·</span>
        <span>{formatDate(vote.date)}</span>
        <span>·</span>
        <span>{VOTE_TYPE_LABEL[vote.voteType]}</span>
      </div>
      <div className="mt-s grid grid-cols-[auto_1fr] items-center gap-x-m gap-y-s sm:gap-x-l">
        <div className="row-span-1 shrink-0 [&_svg]:!h-[88px] [&_svg]:!w-[88px] sm:row-span-2 sm:[&_svg]:!h-[160px] sm:[&_svg]:!w-[160px]">
          <VoteDistributionDonut yes={vote.yes} no={vote.no} abstain={vote.abstain} absent={vote.absent} size={88} />
        </div>
        <VoteTitle title={vote.title} />
        <div className="col-span-2 flex flex-wrap items-center justify-center gap-s sm:col-span-1 sm:col-start-2 sm:justify-start">
          {stamps.map((s) => (
            <Stamp key={s} variant={s} />
          ))}
        </div>
      </div>
    </div>
  )
}
