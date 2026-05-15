import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Search, Users } from 'lucide-react'
import { FilterPill } from '@/views/votesList/FilterPill'
import { SpeechRow } from '@/views/redenSearch/SpeechRow'
import { tokenize } from '@/lib/highlight'
import { makeSnippet } from '@/lib/snippet'
import { loadSpeechTexts, speechTextsLoaded } from '@/lib/speechesStatic'
import { useQuery } from '@tanstack/react-query'
import type { MemberVoteRow } from '@/server/members'
import type { SpeechSummary } from '@/server/speeches'
import { PartySummaryLogoRow } from './PartySummaryLogoRow'
import type { PartySummary } from './PartySummaryModal'

type BallotEntry = { choice: MemberVoteRow['choice']; pictureUrl: string | null }
type Props = { speeches: SpeechSummary[]; ballotByMember: Map<string, BallotEntry>; partySummaries: PartySummary[] }

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'
const PAGE_SIZE = 5

export function DebateList({ speeches, ballotByMember, partySummaries }: Props) {
  const [query, setQuery] = useState('')
  const [party, setParty] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const terms = tokenize(query)
  const texts = useQuery({
    queryKey: ['speech-texts'],
    queryFn: () => loadSpeechTexts(),
    enabled: terms.length > 0,
    staleTime: Infinity,
  })
  const textsLoading = terms.length > 0 && !speechTextsLoaded()
  const parties = useMemo(
    () => Array.from(new Set(speeches.map((s) => s.party).filter((p): p is string => !!p))).sort(),
    [speeches],
  )
  const filtered = useMemo(() => {
    return speeches.filter((s) => {
      if (party && s.party !== party) return false
      if (!terms.length) return true
      const body = texts.data?.[s.id] ?? s.excerpt
      const hay = `${s.speakerName} ${body}`.toLowerCase()
      return terms.every((t) => hay.includes(t))
    })
  }, [speeches, terms, party, texts.data])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const slice = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)
  const reset = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setPage(0) }
  return (
    <section className="mb-l">
      <div className="mb-s text-s uppercase opacity-l" style={{ letterSpacing: '0.08em' }}>Reden zur Abstimmung</div>
      <PartySummaryLogoRow summaries={partySummaries} />
      <div className="mb-m flex flex-wrap items-center gap-m">
        <div className="relative flex-1 min-w-[12rem]">
          <Search size={14} className="absolute left-s top-1/2 -translate-y-1/2 opacity-l" />
          <input
            type="text"
            value={query}
            onChange={(e) => reset(setQuery)(e.target.value)}
            placeholder="Reden durchsuchen"
            className="w-full border bg-transparent py-xs pl-[1.75rem] pr-s text-m outline-none focus:border-fg"
            style={{ borderColor: ROW_BORDER }}
          />
          {textsLoading && <div className="mt-xs text-s opacity-l">Suchindex wird geladen…</div>}
        </div>
        <FilterPill label="Fraktion" icon={Users} options={parties} value={party} onChange={reset(setParty)} />
      </div>
      {textsLoading ? (
        <div className="border-t py-m text-m opacity-l" style={{ borderColor: ROW_BORDER }}>Suche wird vorbereitet…</div>
      ) : filtered.length === 0 ? (
        <div className="border-t py-m text-m opacity-l" style={{ borderColor: ROW_BORDER }}>Keine Reden gefunden.</div>
      ) : (
        <div className="flex flex-col">
          {slice.map((s) => {
            const body = texts.data?.[s.id] ?? s.excerpt
            const snippet = terms.length ? makeSnippet(body, terms) : null
            const ballot = s.speakerMemberId ? ballotByMember.get(s.speakerMemberId) : undefined
            return (
              <SpeechRow
                key={s.id}
                speech={{ ...s, snippet }}
                query={query}
                showVoteLink={false}
                pictureUrl={ballot?.pictureUrl ?? null}
                choice={ballot?.choice ?? null}
              />
            )
          })}
        </div>
      )}
      {pageCount > 1 && <Pager page={safePage} pageCount={pageCount} onPage={setPage} />}
    </section>
  )
}

function windowedPages(page: number, pageCount: number): Array<number | 'ellipsis'> {
  const pages = new Set([0, pageCount - 1, page, page - 1, page + 1])
  const sorted = [...pages].filter((p) => p >= 0 && p < pageCount).sort((a, b) => a - b)
  const out: Array<number | 'ellipsis'> = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('ellipsis')
    out.push(sorted[i])
  }
  return out
}

function Pager({ page, pageCount, onPage }: { page: number; pageCount: number; onPage: (p: number) => void }) {
  return (
    <div className="mt-m flex items-center justify-center gap-xs text-s">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page === 0}
        aria-label="Vorherige Seite"
        className="px-s py-xs opacity-l hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={14} />
      </button>
      {windowedPages(page, pageCount).map((p, i) =>
        p === 'ellipsis'
          ? <span key={`e${i}`} className="px-s py-xs opacity-l">…</span>
          : <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              className={p === page ? 'px-s py-xs font-semibold' : 'px-s py-xs opacity-l hover:opacity-100'}
            >
              {p + 1}
            </button>
      )}
      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page === pageCount - 1}
        aria-label="Nächste Seite"
        className="px-s py-xs opacity-l hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}
