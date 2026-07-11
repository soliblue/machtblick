import { Search } from 'lucide-react'
import { FilterPill } from '@/views/votesList/FilterPill'
import { FilterPillRow } from '@/views/votesList/FilterPillRow'
import { FilterSheet, type FilterSheetGroup } from '@/views/votesList/FilterSheet'
import { MemberFilterPill } from './MemberFilterPill'
import { Pager } from './Pager'
import { SpeechEntry } from '@/views/speeches/SpeechEntry'
import { Reader, type ReaderSpeechItem } from '@/views/speeches/Reader'
import { useReader } from '@/hooks/useReader'
import { formatDate, formatDateLong } from '@/lib/format'
import { useSpeechPeople } from '@/hooks/useSpeechPeople'
import type { SpeechFeedItem, SpeechFeedResponse } from '@/lib/speechesStatic'
import { useCopy, useLocale } from '@/lib/i18n'

type Props = {
  data: SpeechFeedResponse
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

function groupByDate(items: SpeechFeedItem[]): Array<[string, SpeechFeedItem[]]> {
  const map = new Map<string, SpeechFeedItem[]>()
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
  const people = useSpeechPeople()
  const readerItems: ReaderSpeechItem[] = data.items.map((s) => ({
    kind: 'speech',
    ids: s.ids,
    speakerName: s.speakerName,
    speakerMemberId: s.speakerMemberId,
    speakerRole: s.speakerRole,
    party: s.party,
    choice: s.choice,
    pictureUrl: s.speakerMemberId ? people[s.speakerMemberId] ?? null : null,
    date: s.date,
    voteId: s.voteId,
    voteTitle: s.voteTitle,
    fallbackText: s.excerpt,
  }))
  const reader = useReader(readerItems)
  const indexOf = new Map(data.items.map((s, i) => [s.id, i]))
  const memberName = new Map(data.membersOptions.map((o) => [o.id, o.name]))
  const dayLabel = locale === 'en' ? 'Day' : 'Tag'
  const memberLabel = locale === 'en' ? 'Member' : 'Abgeordnete:r'
  const sheetGroups: FilterSheetGroup[] = [
    { key: 'party', label: t.parliamentaryGroup, options: data.parties, value: party, onChange: onPartyChange, format: (o) => o },
    { key: 'date', label: dayLabel, options: data.dates, value: date, onChange: onDateChange, format: formatDate },
    { key: 'member', label: memberLabel, options: data.membersOptions.map((o) => o.id), value: memberId, onChange: onMemberChange, format: (o) => memberName.get(o) ?? o, searchable: true },
  ]
  return (
    <main className="mx-auto max-w-3xl p-l">
      <h1 className="sr-only">{t.speeches}</h1>
      <div className="relative">
        <Search size={14} className="absolute left-s top-1/2 -translate-y-1/2 opacity-l" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t.searchSpeeches}
          className="w-full rounded-m border bg-transparent py-xs pl-[1.75rem] pr-s text-m outline-none focus:border-fg"
          style={{ borderColor: ROW_BORDER }}
        />
        {textsLoading && <div className="mt-xs text-s opacity-l">{t.searchIndexLoading}</div>}
      </div>
      <div className="sticky top-[54px] z-20 -mx-l mt-s hidden bg-background px-l py-s desk:block">
        <FilterPillRow className="">
          <FilterPill label={t.parliamentaryGroup} options={data.parties} value={party} onChange={onPartyChange} />
          <FilterPill label={dayLabel} options={data.dates} value={date} onChange={onDateChange} formatOption={formatDate} />
          <MemberFilterPill label={memberLabel} options={data.membersOptions} value={memberId} onChange={onMemberChange} />
        </FilterPillRow>
      </div>
      <div className="desk:hidden">
        <FilterSheet groups={sheetGroups} activeCount={[party, date, memberId].filter(Boolean).length} />
      </div>
      <div className="mt-m text-s caption opacity-l">
        {textsLoading
          ? t.searchPreparing
          : data.total === 0 ? t.noSpeechesFound : `${data.total.toLocaleString(locale === 'en' ? 'en-US' : 'de-DE')} ${t.speeches}`}
      </div>
      {groupByDate(data.items).map(([day, items]) => (
        <section key={day}>
          <div className="mb-s mt-l text-s caption opacity-l">{formatDateLong(day, locale)}</div>
          {items.map((s) => (
            <SpeechEntry
              key={s.id}
              speech={s}
              mode="card"
              choice={s.choice}
              pictureUrl={s.speakerMemberId ? people[s.speakerMemberId] ?? null : null}
              voteId={s.voteId}
              voteTitle={s.voteTitle}
              query={query}
              onOpen={() => reader.openAt(indexOf.get(s.id) ?? 0)}
            />
          ))}
        </section>
      ))}
      {pageCount > 1 && <Pager page={page} pageCount={pageCount} onPage={onPageChange} />}
      {reader.active && (
        <Reader
          item={reader.active}
          index={reader.index}
          count={reader.count}
          nextName={reader.nextItem?.speakerName ?? null}
          query={query}
          onPrev={reader.prev}
          onNext={reader.next}
          onClose={reader.close}
        />
      )}
    </main>
  )
}
