import type { VoteListItem } from '@/server/votes'
import { useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'
import { useNearViewport } from '@/hooks/useNearViewport'
import { VoteCard } from './VoteCard'

type Props = { vote: VoteListItem; eager: boolean }

export function LazyVoteCard({ vote, eager }: Props) {
  const locale = useLocale()
  const { ref, near } = useNearViewport<HTMLElement>(eager)
  return near ? (
    <VoteCard vote={vote} />
  ) : (
    <article ref={ref} className="flex h-full flex-col justify-center border border-fg/15 bg-background p-l desk:min-h-[240px]">
      <h2 lang={locale} className="font-display text-xl font-semibold leading-[1.15]" style={{ textWrap: 'pretty' }}>
        <a href={withLocale(`/votes/${vote.id}/`, locale)} className="decoration-1 underline-offset-[3px] hover:underline">
          {vote.cleanTitle}
        </a>
      </h2>
    </article>
  )
}
