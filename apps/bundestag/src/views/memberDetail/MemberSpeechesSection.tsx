import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { SpeechResultRow } from '@/views/redenSearch/SpeechResultRow'
import { Pager } from '@/views/redenSearch/Pager'
import type { SpeechResult } from '@/server/speeches'

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'
const PAGE_SIZE = 5

export function MemberSpeechesSection({ speeches }: { speeches: SpeechResult[] }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return speeches
    return speeches.filter((s) => s.excerpt.toLowerCase().includes(q))
  }, [speeches, query])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const slice = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)
  return (
    <section>
      <div className="mb-m flex flex-wrap items-center gap-m">
        <div className="relative flex-1 min-w-[12rem]">
          <Search size={14} className="absolute left-s top-1/2 -translate-y-1/2 opacity-l" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0) }}
            placeholder="Reden durchsuchen"
            className="w-full border bg-transparent py-xs pl-[1.75rem] pr-s text-m outline-none focus:border-fg"
            style={{ borderColor: ROW_BORDER }}
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="border-t py-m text-m opacity-l" style={{ borderColor: ROW_BORDER }}>Keine Reden gefunden.</div>
      ) : (
        <div className="flex flex-col">
          {slice.map((s) => <SpeechResultRow key={s.id} speech={s} />)}
        </div>
      )}
      {pageCount > 1 && <Pager page={safePage} pageCount={pageCount} onPage={setPage} />}
    </section>
  )
}
