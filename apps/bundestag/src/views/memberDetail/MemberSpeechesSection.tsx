import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { SpeechRow } from '@/views/redenSearch/SpeechRow'
import { Pager } from '@/views/redenSearch/Pager'
import { tokenize } from '@/lib/highlight'
import { makeSnippet } from '@/lib/snippet'
import { loadSpeechTexts, speechTextsLoaded } from '@/lib/speechesStatic'
import type { SpeechResult } from '@/server/speeches'
import { useCopy, useLocale } from '@/lib/i18n'

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'
const PAGE_SIZE = 5

export function MemberSpeechesSection({ speeches }: { speeches: SpeechResult[] }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const locale = useLocale()
  const t = useCopy()
  const terms = tokenize(query)
  const texts = useQuery({
    queryKey: ['speech-texts', locale],
    queryFn: () => loadSpeechTexts(locale),
    enabled: terms.length > 0,
    staleTime: Infinity,
  })
  const textsLoading = terms.length > 0 && !speechTextsLoaded(locale)
  const filtered = useMemo(() => {
    if (!terms.length) return speeches
    return speeches.filter((s) => {
      const body = texts.data?.[s.id] ?? s.excerpt
      const hay = `${s.speakerName} ${body}`.toLowerCase()
      return terms.every((t) => hay.includes(t))
    })
  }, [speeches, terms, texts.data])
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
            placeholder={t.searchSpeeches}
            className="w-full border bg-transparent py-xs pl-[1.75rem] pr-s text-m outline-none focus:border-fg"
            style={{ borderColor: ROW_BORDER }}
          />
          {textsLoading && <div className="mt-xs text-s opacity-l">{t.searchIndexLoading}</div>}
        </div>
      </div>
      {textsLoading ? (
        <div className="border-t py-m text-m opacity-l" style={{ borderColor: ROW_BORDER }}>{t.searchPreparing}</div>
      ) : filtered.length === 0 ? (
        <div className="border-t py-m text-m opacity-l" style={{ borderColor: ROW_BORDER }}>{t.noSpeechesFound}</div>
      ) : (
        <div className="flex flex-col">
          {slice.map((s) => {
            const body = texts.data?.[s.id] ?? s.excerpt
            const snippet = terms.length ? makeSnippet(body, terms) : null
            return <SpeechRow key={s.id} speech={{ ...s, snippet }} query={query} />
          })}
        </div>
      )}
      {pageCount > 1 && <Pager page={safePage} pageCount={pageCount} onPage={setPage} />}
    </section>
  )
}
