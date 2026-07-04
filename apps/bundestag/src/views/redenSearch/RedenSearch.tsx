import { Search } from 'lucide-react'
import { FilterPill } from '@/views/votesList/FilterPill'
import { FilterPillRow } from '@/views/votesList/FilterPillRow'
import { MemberFilterPill } from './MemberFilterPill'
import { Pager } from './Pager'
import { SpeechResultRow } from './SpeechResultRow'
import { formatDate } from '@/lib/format'
import type { SpeechSearchResponse, SpeechResult } from '@/server/speeches'
import { useCopy, useLocale } from '@/lib/i18n'

type Props = {
  data: SpeechSearchResponse
  query: string
  party: string | null
  date: string | null
  memberId: string | null
  page: number
  textsLoading: boolean
  onQueryChange: (q: string) => void
  onPartyChange: (p: string | null) => void
  onDateChange: (d: string | null) => void
  onMemberChange: (id: string | null) => void
  onPageChange: (p: number) => void
}

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

function groupByDate(items: SpeechResult[]): Array<[string, SpeechResult[]]> {
  const map = new Map<string, SpeechResult[]>()
  for (const s of items) {
    const list = map.get(s.date) ?? []
    list.push(s)
    map.set(s.date, list)
  }
  return Array.from(map.entries())
}

export function RedenSearch({ data, query, party, date, memberId, page, textsLoading, onQueryChange, onPartyChange, onDateChange, onMemberChange, onPageChange }: Props) {
  const pageCount = Math.max(1, Math.ceil(data.total / data.pageSize))
  const locale = useLocale()
  const t = useCopy()
  return (
    <main className="mx-auto max-w-3xl p-l">
      <h1 className="sr-only">{t.speeches}</h1>
      <p className="mb-l text-m opacity-l">{locale === 'en' ? 'Search plenary speeches from the 21st German Bundestag.' : 'Plenarreden des 21. Deutschen Bundestags durchsuchen.'}</p>
      <div className="mb-s relative">
        <Search size={14} className="absolute left-s top-1/2 -translate-y-1/2 opacity-l" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={locale === 'en' ? 'Keyword' : 'Stichwort'}
          className="w-full border bg-transparent py-xs pl-[1.75rem] pr-s text-m outline-none focus:border-fg"
          style={{ borderColor: ROW_BORDER }}
        />
        {textsLoading && <div className="mt-xs text-s opacity-l">{t.searchIndexLoading}</div>}
      </div>
      <FilterPillRow className="mb-m">
        <FilterPill label={t.parliamentaryGroup} options={data.parties} value={party} onChange={onPartyChange} />
        <FilterPill label={locale === 'en' ? 'Day' : 'Tag'} options={data.dates} value={date} onChange={onDateChange} formatOption={formatDate} />
        <MemberFilterPill label={locale === 'en' ? 'Member' : 'Abgeordnete:r'} options={data.membersOptions} value={memberId} onChange={onMemberChange} />
      </FilterPillRow>
      <div className="mb-m text-s opacity-l">
        {textsLoading
          ? t.searchPreparing
          : data.total === 0 ? t.noSpeechesFound : `${data.total.toLocaleString(locale === 'en' ? 'en-US' : 'de-DE')} ${t.speeches}`}
      </div>
      <div className="flex flex-col">
        {groupByDate(data.items).map(([date, items]) => (
          <div key={date} className="mb-l">
            <div className="mb-xs text-s uppercase opacity-l" style={{ letterSpacing: '0.08em' }}>{formatDate(date)}</div>
            {items.map((s) => <SpeechResultRow key={s.id} speech={s} query={query} />)}
          </div>
        ))}
      </div>
      {pageCount > 1 && <Pager page={page} pageCount={pageCount} onPage={onPageChange} />}
    </main>
  )
}
