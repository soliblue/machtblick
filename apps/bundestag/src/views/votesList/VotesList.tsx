import type { VoteTypeFilter, VoteResultFilter } from '@/hooks/useVoteListFilters'
import type { VoteDayGroup } from '@/hooks/useVoteDayGroups'
import { VISIBLE_VOTE_TYPES } from '@/lib/voteTypes'
import { useCopy, useLocale } from '@/lib/i18n'
import { partyLabel } from '@/lib/parties'
import { LazyVoteCard } from './LazyVoteCard'
import { FilterPill } from './FilterPill'
import { FilterPillRow } from './FilterPillRow'
import { FilterSheet, type FilterSheetGroup } from './FilterSheet'

const EAGER_CARDS = 30

type Props = {
  groups: VoteDayGroup[]
  proposingParty: string | null
  onProposingPartyChange: (value: string | null) => void
  availableParties: string[]
  voteType: VoteTypeFilter | null
  onVoteTypeChange: (value: VoteTypeFilter | null) => void
  result: VoteResultFilter | null
  onResultChange: (value: VoteResultFilter | null) => void
  topic: string | null
  onTopicChange: (value: string | null) => void
  availableTopics: string[]
}

export function VotesList({ groups, proposingParty, onProposingPartyChange, availableParties, voteType, onVoteTypeChange, result, onResultChange, topic, onTopicChange, availableTopics }: Props) {
  const t = useCopy()
  const locale = useLocale()
  const typeLabels: Record<VoteTypeFilter, string> = {
    namentlich: t.namedVote,
    handzeichen: t.showOfHands,
    hammelsprung: t.division,
  }
  const resultLabels: Record<VoteResultFilter, string> = {
    angenommen: t.accepted,
    abgelehnt: t.rejected,
  }
  const flat = groups.flatMap((g) => g.votes)
  const sheetGroups: FilterSheetGroup[] = [
    { key: 'type', label: t.type, options: [...VISIBLE_VOTE_TYPES], value: voteType, onChange: (v) => onVoteTypeChange(v as VoteTypeFilter | null), format: (o) => typeLabels[o as VoteTypeFilter] },
    { key: 'party', label: t.proposer, options: availableParties, value: proposingParty, onChange: onProposingPartyChange, format: (o) => partyLabel(o, locale) },
    { key: 'result', label: t.result, options: ['angenommen', 'abgelehnt'], value: result, onChange: (v) => onResultChange(v as VoteResultFilter | null), format: (o) => resultLabels[o as VoteResultFilter] },
    ...(availableTopics.length > 0 ? [{ key: 'topic', label: t.category, options: availableTopics, value: topic, onChange: onTopicChange, format: (o: string) => o }] : []),
  ]
  const activeCount = [voteType, proposingParty, result, topic].filter(Boolean).length
  return (
    <>
      <style>{'@media (max-width:699px){html{scroll-snap-type:y mandatory;scroll-padding-top:52px}}'}</style>
      <div className="sticky top-[54px] z-20 hidden border-b border-fg/15 bg-background desk:block">
        <div className="px-l py-s desk:mx-auto desk:max-w-3xl">
          <FilterPillRow className="">
            <FilterPill
              label={t.type}
              options={VISIBLE_VOTE_TYPES}
              value={voteType}
              onChange={(v) => onVoteTypeChange(v as VoteTypeFilter | null)}
              formatOption={(o) => typeLabels[o as VoteTypeFilter]}
            />
            <FilterPill
              label={t.proposer}
              options={availableParties}
              value={proposingParty}
              onChange={onProposingPartyChange}
            />
            <FilterPill
              label={t.result}
              options={['angenommen', 'abgelehnt']}
              value={result}
              onChange={(v) => onResultChange(v as VoteResultFilter | null)}
              formatOption={(o) => resultLabels[o as VoteResultFilter]}
            />
            {availableTopics.length > 0 && (
              <FilterPill
                label={t.category}
                options={availableTopics}
                value={topic}
                onChange={onTopicChange}
              />
            )}
          </FilterPillRow>
        </div>
      </div>
      <h1 className="sr-only">{t.votes}</h1>
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){var f=function(){requestAnimationFrame(function(){var css='';document.querySelectorAll('[data-clamp-summary]>p').forEach(function(p){var card=p.closest('[id]');var h=p.parentElement.clientHeight;if(!card||!h)return;var lh=parseFloat(getComputedStyle(p).lineHeight);var n=Math.max(1,Math.floor(h/lh));css+='[id=\"'+card.id+'\"] [data-clamp-summary]>p{-webkit-line-clamp:'+n+'}'});var s=document.createElement('style');s.textContent=css;document.head.appendChild(s)})};document.readyState==='loading'?document.addEventListener('DOMContentLoaded',f):f()})()",
        }}
      />
      <div className="desk:hidden">
        <FilterSheet groups={sheetGroups} activeCount={activeCount} />
        {flat.map((v, i) => (
          <div key={v.id} id={v.id} className="h-[calc(100svh-96px)] snap-start snap-always px-m pt-l">
            <LazyVoteCard vote={v} eager={i < EAGER_CARDS} />
          </div>
        ))}
      </div>
      <main className="mx-auto hidden max-w-3xl flex-col gap-xl px-l pb-[64px] pt-xl desk:flex">
        {flat.map((v, i) => (
          <div key={v.id} id={`d-${v.id}`}>
            <LazyVoteCard vote={v} eager={i < EAGER_CARDS} />
          </div>
        ))}
      </main>
    </>
  )
}
