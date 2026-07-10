import type { MpVoteListItem } from '@/server/mpVotes'
import type { ParliamentSlug } from '@/lib/parliaments'
import { MpSectionNav } from './MpSectionNav'
import { MpLazyVoteCard } from './MpLazyVoteCard'
import { MpEmpty } from './MpEmpty'

const EAGER_CARDS = 12

type Props = { section: ParliamentSlug; votes: MpVoteListItem[] }

export function MpVotesList({ section, votes }: Props) {
  return (
    <>
      <MpSectionNav section={section} active="votes" />
      {votes.length === 0 ? (
        <MpEmpty>Noch keine Abstimmungen geladen.</MpEmpty>
      ) : (
        <>
          <style>{'@media (max-width:699px){html{scroll-snap-type:y mandatory;scroll-padding-top:52px}}'}</style>
          <div className="desk:hidden">
            {votes.map((v, i) => (
              <div key={v.id} className="h-[calc(100svh-160px)] snap-start snap-always px-m pt-l">
                <MpLazyVoteCard vote={v} section={section} eager={i < EAGER_CARDS} />
              </div>
            ))}
          </div>
          <main className="mx-auto hidden max-w-3xl flex-col gap-xl px-l pb-[64px] pt-xl desk:flex">
            {votes.map((v, i) => (
              <MpLazyVoteCard key={v.id} vote={v} section={section} eager={i < EAGER_CARDS} />
            ))}
          </main>
        </>
      )}
    </>
  )
}
