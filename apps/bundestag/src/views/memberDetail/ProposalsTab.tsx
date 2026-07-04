import { Search } from 'lucide-react'
import type { MemberInitiativeRow as MemberInitiativeRowData } from '@/server/members'
import { useCopy, useLocale } from '@/lib/i18n'
import { useMemberProposalFilters, type MemberProposalVoteLinkFilter } from '@/hooks/useMemberProposalFilters'
import { FilterPill } from '@/views/votesList/FilterPill'
import { FilterPillRow } from '@/views/votesList/FilterPillRow'
import { ProposalRow } from './ProposalRow'

const BORDER = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

type Props = {
  proposals: MemberInitiativeRowData[]
  statusFilter: string | null
  setStatusFilter: (v: string | null) => void
  topicFilter: string | null
  setTopicFilter: (v: string | null) => void
  voteLinkFilter: MemberProposalVoteLinkFilter | null
  setVoteLinkFilter: (v: MemberProposalVoteLinkFilter | null) => void
  query: string
  setQuery: (v: string) => void
}

const VOTE_LINK_OPTIONS: MemberProposalVoteLinkFilter[] = ['with', 'without']

export function ProposalsTab({ proposals, statusFilter, setStatusFilter, topicFilter, setTopicFilter, voteLinkFilter, setVoteLinkFilter, query, setQuery }: Props) {
  const locale = useLocale()
  const t = useCopy()
  const { filtered, statusOptions, topicOptions } = useMemberProposalFilters(proposals, { statusFilter, topicFilter, voteLinkFilter, query })
  const voteLinkLabels: Record<MemberProposalVoteLinkFilter, string> = {
    with: locale === 'en' ? 'With vote' : 'Mit Abstimmung',
    without: locale === 'en' ? 'Without vote' : 'Ohne Abstimmung',
  }
  return proposals.length > 0 ? (
    <section>
      <div className="mb-m relative min-w-[12rem]">
        <Search size={14} className="absolute left-s top-1/2 -translate-y-1/2 opacity-l" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={locale === 'en' ? 'Search motions' : 'Anträge durchsuchen'}
          className="w-full border bg-transparent py-xs pl-[1.75rem] pr-s text-m outline-none focus:border-fg"
          style={{ borderColor: BORDER }}
        />
      </div>
      <FilterPillRow>
        {statusOptions.length > 0 && (
          <FilterPill
            label={locale === 'en' ? 'Status' : 'Stand'}
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            formatOption={(o) =>
              o === 'Beschlussempfehlung liegt vor' ? locale === 'en' ? 'Recommendation' : 'Beschlussempfehlung'
              : o === 'Abgelehnt' ? locale === 'en' ? 'Rejected' : 'Abgelehnt'
              : o === 'Überwiesen' ? locale === 'en' ? 'Referred' : 'Überwiesen'
              : o === 'Noch nicht beraten' ? locale === 'en' ? 'Not debated' : 'Nicht beraten'
              : o}
          />
        )}
        <FilterPill
          label={locale === 'en' ? 'Vote' : 'Abstimmung'}
          options={VOTE_LINK_OPTIONS}
          value={voteLinkFilter}
          onChange={(v) => setVoteLinkFilter(v as MemberProposalVoteLinkFilter | null)}
          formatOption={(o) => voteLinkLabels[o as MemberProposalVoteLinkFilter]}
        />
        {topicOptions.length > 0 && (
          <FilterPill
            label={t.category}
            options={topicOptions}
            value={topicFilter}
            onChange={setTopicFilter}
          />
        )}
      </FilterPillRow>
      {filtered.length > 0 ? (
        <div className="flex flex-col">
          {filtered.map((row) => <ProposalRow key={row.antragId} row={row} />)}
        </div>
      ) : (
        <div className="border p-xl text-center text-m opacity-l" style={{ borderColor: BORDER }}>
          <div className="font-semibold opacity-100">{locale === 'en' ? 'No matching motions' : 'Keine passenden Anträge'}</div>
        </div>
      )}
    </section>
  ) : (
    <div className="border p-xl text-center text-m opacity-l" style={{ borderColor: BORDER }}>
      <div className="font-semibold opacity-100">{locale === 'en' ? 'No proposals in term 21' : 'Keine Anträge in WP21'}</div>
    </div>
  )
}
