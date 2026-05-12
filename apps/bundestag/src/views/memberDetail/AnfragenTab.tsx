import { useMemo, useState } from 'react'
import { Filter, FileQuestion, CheckCircle2, Building2, Search } from 'lucide-react'
import type { MemberAnfragen, AnfrageRow as AnfrageRowData } from '@/server/anfragen'
import { FilterPill } from '@/views/votesList/FilterPill'
import { AnfragenSummary } from './AnfragenSummary'
import { AnfrageRow } from './AnfrageRow'

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

const TYPE_OPTIONS = ['kleine', 'grosse', 'schriftlich']
const TYPE_LABEL: Record<string, string> = { kleine: 'Kleine', grosse: 'Große', schriftlich: 'Schriftliche' }
const STATUS_OPTIONS = ['beantwortet', 'offen']
const STATUS_LABEL: Record<string, string> = { beantwortet: 'Beantwortet', offen: 'Offen' }

type GroupBy = 'thema' | 'datum'

type Props = { data: MemberAnfragen }

export function AnfragenTab({ data }: Props) {
  const [groupBy, setGroupBy] = useState<GroupBy>('thema')
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
  const filteredFlat = useMemo(() => data.flat.filter(matches), [data.flat, typeFilter, statusFilter, ressortFilter, query])
  const filteredGroups = useMemo(() => data.groups
    .map((g) => ({ ...g, rows: g.rows.filter(matches), count: g.rows.filter(matches).length }))
    .filter((g) => g.count > 0), [data.groups, typeFilter, statusFilter, ressortFilter, query])
  return (
    <section>
      <div className="mb-s flex items-center justify-end gap-xs text-s">
        <span className="opacity-m">Gruppiert nach</span>
        <GroupToggle value={groupBy} onChange={setGroupBy} />
      </div>
      <div className="mb-l border p-m" style={{ borderColor: ROW_BORDER }}>
        <AnfragenSummary data={data} />
      </div>
      {data.total > 0 ? (
        <>
          <div className="mb-m flex flex-wrap items-center gap-s">
            <Filter size={14} className="opacity-l" />
            <FilterPill
              label="Typ"
              icon={FileQuestion}
              options={TYPE_OPTIONS}
              value={typeFilter}
              onChange={setTypeFilter}
              formatOption={(o) => TYPE_LABEL[o]}
            />
            <FilterPill
              label="Status"
              icon={CheckCircle2}
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
              formatOption={(o) => STATUS_LABEL[o]}
            />
            {topRessorts.length > 0 && (
              <FilterPill
                label="Ressort"
                icon={Building2}
                options={topRessorts}
                value={ressortFilter}
                onChange={setRessortFilter}
              />
            )}
            <div className="relative min-w-[12rem] flex-1">
              <Search size={14} className="absolute left-s top-1/2 -translate-y-1/2 opacity-l" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Anfragen durchsuchen"
                className="w-full border bg-transparent py-xs pl-[1.75rem] pr-s text-m outline-none focus:border-fg"
                style={{ borderColor: ROW_BORDER }}
              />
            </div>
          </div>
          {groupBy === 'thema' ? (
            <div className="flex flex-col">
              {filteredGroups.map((g) => (
                <div key={g.sachgebiet} className="mt-l first:mt-0">
                  <div className="mb-s flex items-baseline justify-between text-s uppercase opacity-l" style={{ letterSpacing: '0.08em' }}>
                    <span>{g.sachgebiet}</span>
                    <span className="font-semibold opacity-100">{g.count}</span>
                  </div>
                  <div className="flex flex-col">
                    {g.rows.map((r) => <AnfrageRow key={`${g.sachgebiet}-${r.id}`} row={r} />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredFlat.map((r) => <AnfrageRow key={r.id} row={r} />)}
            </div>
          )}
        </>
      ) : (
        <div className="border p-xl text-center text-m opacity-l" style={{ borderColor: ROW_BORDER }}>
          <div className="font-semibold opacity-100">Keine Anfragen in WP21</div>
          <div className="mt-s">Diese Abgeordnete hat bisher keine Anfragen mitgezeichnet.</div>
        </div>
      )}
    </section>
  )
}

function GroupToggle({ value, onChange }: { value: GroupBy; onChange: (v: GroupBy) => void }) {
  const opts: Array<{ key: GroupBy; label: string }> = [
    { key: 'thema', label: 'Thema' },
    { key: 'datum', label: 'Datum' },
  ]
  return (
    <div className="flex items-center" style={{ border: `1px solid ${ROW_BORDER}` }}>
      {opts.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className="px-s py-xs text-s transition-colors"
          style={{
            background: value === o.key ? 'var(--color-surface)' : 'transparent',
            fontWeight: value === o.key ? 600 : 400,
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
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
