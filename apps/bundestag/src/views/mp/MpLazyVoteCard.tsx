import type { MpVoteListItem } from '@/server/mpVotes'
import type { ParliamentSlug } from '@/lib/parliaments'
import { useNearViewport } from '@/hooks/useNearViewport'
import { MpVoteCard } from './MpVoteCard'

type Props = { vote: MpVoteListItem; section: ParliamentSlug; eager: boolean }

export function MpLazyVoteCard({ vote, section, eager }: Props) {
  const { ref, near } = useNearViewport<HTMLElement>(eager)
  const title = vote.titleDe ?? vote.title
  return near ? (
    <MpVoteCard vote={vote} section={section} />
  ) : (
    <article ref={ref} className="flex h-full flex-col justify-center border border-fg/15 bg-background p-l desk:min-h-[240px]">
      <h2 className="font-display text-xl font-semibold leading-[1.15]" style={{ textWrap: 'pretty' }}>
        <a href={`/${section}/votes/${vote.id}/`} className="decoration-1 underline-offset-[3px] hover:underline">
          {title}
        </a>
      </h2>
    </article>
  )
}
