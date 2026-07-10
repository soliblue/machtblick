import type { MpVoteListItem } from '@/server/mpVotes'
import type { ParliamentSlug } from '@/lib/parliaments'
import { formatDateShort } from '@/lib/format'
import { SERIF } from '@/lib/fonts'
import { Stamp } from '@/views/votesList/Stamp'
import { VoteHemicycle } from '@/views/votesList/VoteHemicycle'
import { MpDonutRow } from './MpDonutRow'
import { mpDek } from './mpDek'

type Props = { vote: MpVoteListItem; section: ParliamentSlug }

export function MpVoteCard({ vote, section }: Props) {
  const accepted = vote.result === 'angenommen'
  const title = vote.titleDe ?? vote.title
  return (
    <article className="group relative flex h-full flex-col border border-fg/15 bg-background p-l desk:grid desk:h-auto desk:grid-cols-[minmax(0,1fr)_280px] desk:gap-x-xl">
      <a
        href={`/${section}/votes/${vote.id}/`}
        className="absolute inset-0"
        aria-label={[title, accepted ? 'Angenommen' : 'Abgelehnt', `Ja ${vote.yes}`, `Nein ${vote.no}`, `Enthaltung ${vote.abstain}`].join(' · ')}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-s">
          <span className="min-w-0 truncate text-s caption opacity-l">{vote.titleIsEnglish ? 'Titel auf Englisch' : ''}</span>
          <Stamp variant={vote.result} rotated={false} />
          <span className="justify-self-end whitespace-nowrap text-s caption opacity-l">{formatDateShort(vote.date)}</span>
        </div>
        <h2
          className="mt-m line-clamp-4 font-display text-xl font-semibold leading-[1.15] decoration-1 underline-offset-[3px] group-hover:underline"
          style={{ textWrap: 'pretty' }}
        >
          {title}
        </h2>
        <div className="relative mt-m min-h-0 flex-1 overflow-hidden text-m leading-[1.45]">
          <p style={{ fontFamily: SERIF }}>{mpDek(vote)}</p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-l pt-m desk:pt-0">
        <VoteHemicycle yes={vote.yes} no={vote.no} abstain={vote.abstain} absent={vote.absent} totalMembers={vote.totalMembers} />
        <div className="w-full desk:max-w-[320px]">
          <MpDonutRow partySummaries={vote.partySummaries} />
        </div>
      </div>
    </article>
  )
}
