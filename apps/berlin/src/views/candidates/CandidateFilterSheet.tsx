import { useEffect, useRef, useState } from 'react'
import { Filter, Search, X } from 'lucide-react'

type Props = {
  query: string
  party: string | null
  district: string | null
  constituency: number | null
  personalOnly: boolean
  parties: { value: string; label: string }[]
  districts: string[]
  constituencies: number[]
  resultCount: number
  onQueryChange: (query: string) => void
  onPartyChange: (party: string | null) => void
  onDistrictChange: (district: string | null) => void
  onConstituencyChange: (constituency: number | null) => void
  onPersonalOnlyChange: (personalOnly: boolean) => void
  onReset: () => void
}

export function CandidateFilterSheet({
  query,
  party,
  district,
  constituency,
  personalOnly,
  parties,
  districts,
  constituencies,
  resultCount,
  onQueryChange,
  onPartyChange,
  onDistrictChange,
  onConstituencyChange,
  onPersonalOnlyChange,
  onReset
}: Props) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const close = () => setOpen(false)
  const active = Boolean(query || party || district || constituency || personalOnly)

  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus()
      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') setOpen(false)
      }
      document.addEventListener('keydown', onKeyDown)
      return () => {
        document.removeEventListener('keydown', onKeyDown)
        document.body.style.overflow = previousOverflow
        triggerRef.current?.focus()
      }
    }
    return undefined
  }, [open])

  return (
    <div className="desk:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(16px+env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 items-center gap-s rounded-full bg-fg px-l py-s text-m text-background shadow-[0_2px_8px_rgba(10,10,10,0.2),0_8px_24px_rgba(10,10,10,0.18)]"
      >
        <Filter size={14} aria-hidden="true" />
        <span className={active ? 'font-semibold' : ''}>
          {district ? `${district}${constituency ? ` · WK ${constituency}` : ''}` : 'Filter'}
        </span>
      </button>
      {open ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Kandidierende filtern">
          <button type="button" aria-label="Filter schließen" onClick={close} className="absolute inset-0 bg-black/40" />
          <div
            ref={panelRef}
            tabIndex={-1}
            className="absolute inset-x-0 bottom-0 max-h-[78svh] overflow-y-auto rounded-t-m border-t border-fg/15 bg-background px-l pb-[calc(24px+env(safe-area-inset-bottom))] outline-none"
          >
            <div className="sticky top-0 z-10 -mx-l mb-l flex items-center justify-between border-b border-fg/15 bg-background px-l py-s">
              <button type="button" onClick={close} aria-label="Filter schließen" className="flex size-11 items-center justify-center">
                <X size={17} aria-hidden="true" />
              </button>
              <span className="text-s caption opacity-l">{resultCount} Kandidierende</span>
              <button
                type="button"
                onClick={onReset}
                className="text-s underline underline-offset-4 opacity-l"
              >
                Zurücksetzen
              </button>
            </div>
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-s top-1/2 -translate-y-1/2 opacity-l" />
              <input
                type="search"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Name, Beruf oder Schwerpunkt"
                aria-label="Kandidierende durchsuchen"
                className="w-full rounded-m border border-fg/15 bg-transparent py-s pl-[30px] pr-s text-m outline-none focus:border-fg"
              />
            </div>
            <div className="mt-l">
              <div className="text-s caption opacity-l">Bezirk</div>
              <div className="mt-s flex flex-wrap gap-s">
                {districts.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onDistrictChange(option === district ? null : option)}
                    className={`rounded-m border border-fg/15 px-m py-s text-m ${option === district ? 'bg-surface font-semibold' : ''}`}
                  >
                    {option}{option === district ? <span className="ml-s opacity-l">×</span> : null}
                  </button>
                ))}
              </div>
            </div>
            {district ? (
              <div className="mt-l">
                <div className="text-s caption opacity-l">Wahlkreis</div>
                <div className="mt-s flex flex-wrap gap-s">
                  {constituencies.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onConstituencyChange(option === constituency ? null : option)}
                      className={`min-w-11 rounded-m border border-fg/15 px-m py-s text-m ${option === constituency ? 'bg-surface font-semibold' : ''}`}
                    >
                      {option}{option === constituency ? <span className="ml-s opacity-l">×</span> : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-l">
              <div className="text-s caption opacity-l">Partei</div>
              <div className="mt-s flex flex-wrap gap-s">
                {parties.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onPartyChange(option.value === party ? null : option.value)}
                    className={`rounded-m border border-fg/15 px-m py-s text-m ${option.value === party ? 'bg-surface font-semibold' : ''}`}
                  >
                    {option.label}{option.value === party ? <span className="ml-s opacity-l">×</span> : null}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              aria-pressed={personalOnly}
              onClick={() => onPersonalOnlyChange(!personalOnly)}
              className={`mt-l w-full rounded-m border border-fg/15 px-m py-s text-left text-m ${personalOnly ? 'bg-surface font-semibold' : ''}`}
            >
              Nur mit persönlichen Schwerpunkten
            </button>
            <button type="button" onClick={close} className="mt-l w-full rounded-m bg-fg px-l py-m text-m font-semibold text-background">
              {resultCount} Kandidierende anzeigen
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
