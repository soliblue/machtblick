import { useMemo, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Search, Users } from 'lucide-react'
import { Link } from '../../lib/Link'
import { PartyBadge } from '@/views/votesList/PartyBadge'
import { FilterPill } from '@/views/votesList/FilterPill'
import { useSpeechBody } from '@/hooks/useSpeechBody'
import type { SpeechSummary } from '@/server/speeches'

type Props = { speeches: SpeechSummary[] }

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

const PAGE_SIZE = 5

export function DebateList({ speeches }: Props) {
  const [query, setQuery] = useState('')
  const [party, setParty] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const parties = useMemo(
    () => Array.from(new Set(speeches.map((s) => s.party).filter((p): p is string => !!p))).sort(),
    [speeches],
  )
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return speeches.filter((s) => {
      if (party && s.party !== party) return false
      if (!q) return true
      return s.speakerName.toLowerCase().includes(q) || s.excerpt.toLowerCase().includes(q)
    })
  }, [speeches, query, party])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const slice = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)
  const reset = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setPage(0) }
  return (
    <section className="mb-l">
      <div className="mb-s text-s uppercase opacity-l" style={{ letterSpacing: '0.08em' }}>Reden am Sitzungstag</div>
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
        </div>
        <FilterPill label="Fraktion" icon={Users} options={parties} value={party} onChange={reset(setParty)} />
      </div>
      {filtered.length === 0 ? (
        <div className="border-t py-m text-m opacity-l" style={{ borderColor: ROW_BORDER }}>Keine Reden gefunden.</div>
      ) : (
        <div className="flex flex-col">
          {slice.map((s) => <DebateRow key={s.id} speech={s} />)}
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

function DebateRow({ speech }: { speech: SpeechSummary }) {
  const [open, setOpen] = useState(false)
  const body = useSpeechBody(speech.id, open)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setOpen((v) => !v)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setOpen((v) => !v)
        }
      }}
      className="cursor-pointer border-t py-m"
      style={{ borderColor: ROW_BORDER }}
    >
      <div className="grid grid-cols-[1fr_auto] items-start gap-m">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-s">
            <SpeakerName speech={speech} />
            {speech.speakerRole
              ? <span className="text-s opacity-l">{speech.speakerRole}</span>
              : <PartyBadge party={speech.party} compact />}
          </div>
          {open && body.data ? (
            <div className="mt-s text-m opacity-l whitespace-pre-wrap">{body.data.text}</div>
          ) : (
            <div className={open ? 'mt-s text-m opacity-l' : 'mt-s text-m opacity-l line-clamp-2'}>
              {speech.excerpt}
            </div>
          )}
        </div>
        <ChevronDown
          size={17}
          className="opacity-l transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </div>
    </div>
  )
}

function SpeakerName({ speech }: { speech: SpeechSummary }) {
  if (speech.speakerMemberId) {
    return (
      <Link
        to="/members/$id/"
        params={{ id: speech.speakerMemberId }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 font-semibold hover:opacity-80"
      >
        {speech.speakerName}
      </Link>
    )
  }
  return <span className="font-semibold">{speech.speakerName}</span>
}
