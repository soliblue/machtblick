import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { MemberAnfragen, AnfrageRow as AnfrageRowData } from '@/server/anfragen'
import { FilterPill } from '@/views/votesList/FilterPill'
import { AnfrageRow } from './AnfrageRow'
import { useLocale } from '@/lib/i18n'

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

const TYPE_OPTIONS = ['kleine', 'grosse', 'schriftlich']
const TYPE_LABEL: Record<string, string> = { kleine: 'Kleine', grosse: 'Große', schriftlich: 'Schriftliche' }
const TYPE_LABEL_EN: Record<string, string> = { kleine: 'Minor', grosse: 'Major', schriftlich: 'Written' }
const STATUS_OPTIONS = ['beantwortet', 'offen']
const STATUS_LABEL: Record<string, string> = { beantwortet: 'Beantwortet', offen: 'Offen' }
const STATUS_LABEL_EN: Record<string, string> = { beantwortet: 'Answered', offen: 'Open' }

type Props = { data: MemberAnfragen }

export function AnfragenTab({ data }: Props) {
  const locale = useLocale()
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [ressortFilter, setRessortFilter] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const topRessorts = useMemo(() => topByCount(data.flat.map((r) => r.answerRessort), 8), [data.flat])
  const matches = (r: AnfrageRowData) => {
    if (typeFilter && r.type !== typeFilter) return false
    if (statusFilter === 'beantwortet' && r.beratungsstand !== 'Beantwortet') return false
    if (statusFilter === 'offen' && r.beratungsstand === 'Beantwortet') return false
    if (ressortFilter && r.answerRessort !== ressortFilter) return false
    if (query && !r.title.toLowerCase().includes(query.trim().toLowerCase())) return false
    return true
  }
  const filtered = useMemo(() => data.flat.filter(matches), [data.flat, typeFilter, statusFilter, ressortFilter, query])
  return (
    <section>
      {data.total > 0 ? (
        <>
          <div className="mb-m relative min-w-[12rem]">
            <Search size={14} className="absolute left-s top-1/2 -translate-y-1/2 opacity-l" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={locale === 'en' ? 'Search questions' : 'Anfragen durchsuchen'}
              className="w-full border bg-transparent py-xs pl-[1.75rem] pr-s text-m outline-none focus:border-fg"
              style={{ borderColor: ROW_BORDER }}
            />
          </div>
          <div className="mb-m flex flex-wrap items-center gap-s">
            <FilterPill
              label={locale === 'en' ? 'Type' : 'Typ'}
              options={TYPE_OPTIONS}
              value={typeFilter}
              onChange={setTypeFilter}
              formatOption={(o) => locale === 'en' ? TYPE_LABEL_EN[o] : TYPE_LABEL[o]}
            />
            <FilterPill
              label="Status"
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
              formatOption={(o) => locale === 'en' ? STATUS_LABEL_EN[o] : STATUS_LABEL[o]}
            />
            {topRessorts.length > 0 && (
              <FilterPill
                label={locale === 'en' ? 'Ministry' : 'Ressort'}
                options={topRessorts}
                value={ressortFilter}
                onChange={setRessortFilter}
              />
            )}
          </div>
          <div className="flex flex-col">
            {filtered.map((r) => <AnfrageRow key={r.id} row={r} />)}
          </div>
        </>
      ) : (
        <div className="border p-xl text-center text-m opacity-l" style={{ borderColor: ROW_BORDER }}>
          <div className="font-semibold opacity-100">{locale === 'en' ? 'No questions in term 21' : 'Keine Anfragen in WP21'}</div>
          <div className="mt-s">{locale === 'en' ? 'This member has not cosigned any questions yet.' : 'Diese Abgeordnete hat bisher keine Anfragen mitgezeichnet.'}</div>
        </div>
      )}
    </section>
  )
}

function topByCount(values: Array<string | null>, n: number): string[] {
  const counts = new Map<string, number>()
  for (const v of values) {
    if (!v) continue
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k)
}
