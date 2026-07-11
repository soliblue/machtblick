import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, X } from 'lucide-react'
import { DebateThread } from '@/views/speeches/DebateThread'
import { buildDebateThread } from '@/hooks/debateThread'
import { formatDateShort } from '@/lib/format'
import { PARTY_COLOR } from '@/lib/parties'
import { withLocale } from '@/lib/locale'
import { useCopy, useLocale } from '@/lib/i18n'
import type { SpeechMetaEntry } from '@/lib/speechesStatic'
import { loadSpeechTexts } from '@/lib/speechesStatic'
import { memberSpeechGroupTitle, type MemberSpeechGroup } from '@/hooks/memberSpeechGroups'
import type { SpeechSummary } from '@/server/speeches'

const HAIR = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

type Props = {
  group: MemberSpeechGroup
  rows?: SpeechMetaEntry[]
  loading: boolean
  query: string
  people: Record<string, string>
  memberId: string
  memberParty: string | null
  onClose: () => void
}

export function MemberDebateDialog({ group, rows, loading, query, people, memberId, memberParty, onClose }: Props) {
  const locale = useLocale()
  const t = useCopy()
  const panelRef = useRef<HTMLElement>(null)
  const title = memberSpeechGroupTitle(group, locale === 'en' ? 'Speech' : 'Rede')
  const baseRows: SpeechSummary[] = rows?.length ? rows : group.speeches
  const threadRows = buildDebateThread(baseRows)
  const texts = useQuery({
    queryKey: ['speech-texts', locale],
    queryFn: () => loadSpeechTexts(locale),
    staleTime: Infinity,
  })
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    panel?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
      if (event.key === 'Tab' && panel) {
        const items = panel.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')
        const first = items[0]
        const last = items[items.length - 1]
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
          event.preventDefault()
          last.focus()
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      trigger?.focus()
    }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50" role="presentation" onClick={onClose}>
      <div className="absolute inset-0 bg-fg/40" />
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-debate-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="absolute inset-0 flex flex-col bg-background outline-none desk:inset-auto desk:left-1/2 desk:top-1/2 desk:h-[85vh] desk:w-[90vw] desk:max-w-3xl desk:-translate-x-1/2 desk:-translate-y-1/2 desk:overflow-hidden desk:rounded-m desk:border desk:border-fg/15"
      >
        <header className="flex items-start gap-m border-b p-l" style={{ borderColor: HAIR }}>
          <div className="min-w-0 flex-1">
            <h2 id="member-debate-title" className="font-display text-l font-semibold leading-tight" style={{ overflowWrap: 'anywhere' }}>
              {title}
            </h2>
            <div className="mt-s flex flex-wrap items-center gap-x-s gap-y-xs text-s caption opacity-l">
              <span>{formatDateShort(group.date, locale)}</span>
              {group.voteId && (
                <>
                  <span aria-hidden="true">/</span>
                  <a href={withLocale(`/votes/${group.voteId}/`, locale)} className="inline-flex items-center gap-xs hover:opacity-100">
                    {t.toVote}
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                </>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={t.close} className="shrink-0 p-xs opacity-l hover:opacity-100">
            <X size={19} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-l pb-xl pt-l">
          {loading && rows === undefined ? (
            <div className="py-xl text-center text-m opacity-l">{locale === 'en' ? 'Loading debate...' : 'Debatte wird geladen...'}</div>
          ) : (
            <DebateThread
              rows={threadRows}
              pictureFor={(speech) => speech.speakerMemberId ? people[speech.speakerMemberId] ?? null : null}
              fullTextFor={(speech) => texts.data?.[speech.id]}
              fullTextLoading={texts.isLoading}
              highlightMemberId={memberId}
              highlightColor={PARTY_COLOR[memberParty ?? ''] ?? 'var(--color-fg)'}
              query={query}
              onOpenTurn={() => undefined}
            />
          )}
        </div>
      </section>
    </div>
  )
}
