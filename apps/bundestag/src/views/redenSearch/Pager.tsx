import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = { page: number; pageCount: number; onPage: (p: number) => void }

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

export function Pager({ page, pageCount, onPage }: Props) {
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
