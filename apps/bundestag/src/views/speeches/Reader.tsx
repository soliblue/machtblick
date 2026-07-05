import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { SpeakerAvatar } from './SpeakerAvatar'
import { CHOICE_STANCE, StanceText, type Stance } from './StanceText'
import { PartyBadge } from '@/views/votesList/PartyBadge'
import { PartyLogo } from '@/views/votesList/PartyLogo'
import { Markdown } from '@/lib/Markdown'
import { useSpeechBody } from '@/hooks/useSpeechBody'
import { highlight, tokenize } from '@/lib/highlight'
import { SERIF } from '@/lib/fonts'
import { formatDate } from '@/lib/format'
import { partyLabel } from '@/lib/parties'
import type { SpeechBallotChoice } from '@/lib/speechesStatic'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

export type ReaderSpeechItem = {
  kind: 'speech'
  ids: string[]
  speakerName: string
  speakerMemberId: string | null
  speakerRole: string | null
  party: string | null
  choice: SpeechBallotChoice | null
  pictureUrl: string | null
  date: string | null
  voteId: string | null
  voteTitle: string | null
  fallbackText: string
}

export type ReaderSummaryItem = {
  kind: 'summary'
  party: string
  stance: Stance
  positionSummary: string | null
  keyPoints: string | null
  dissentNote: string | null
}

export type ReaderItem = ReaderSpeechItem | ReaderSummaryItem

type Props = {
  item: ReaderItem
  index: number
  count: number
  nextName?: string | null
  query?: string
  onPrev?: () => void
  onNext?: () => void
  onClose: () => void
}

const HAIR = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

export function Reader({ item, index, count, nextName = null, query = '', onPrev, onNext, onClose }: Props) {
  const t = useCopy()
  const locale = useLocale()
  const panelRef = useRef<HTMLElement>(null)
  const body = useSpeechBody(item.kind === 'speech' ? item.ids : [], item.kind === 'speech', locale)
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    if (!panel) return
    panel.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const items = panel.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      trigger?.focus()
    }
  }, [])
  const label = item.kind === 'summary' ? `${t.partySummaryAria} ${partyLabel(item.party, locale)}` : item.speakerName
  return (
    <div className="fixed inset-0 z-50" role="presentation" onClick={onClose}>
      <div className="absolute inset-0 bg-fg/40" />
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 top-[64px] flex flex-col bg-background shadow-[0_1px_3px_rgba(10,10,10,0.08),0_6px_16px_rgba(10,10,10,0.07)] outline-none desk:inset-auto desk:left-1/2 desk:top-1/2 desk:h-[85vh] desk:w-[90vw] desk:max-w-[42rem] desk:-translate-x-1/2 desk:-translate-y-1/2 desk:border desk:border-fg/15"
      >
        <div className="flex justify-center pt-s desk:hidden">
          <span className="h-[4px] w-[36px] rounded-full bg-fg/15" />
        </div>
        <header className="flex items-center gap-m border-b p-l pt-s desk:pt-l" style={{ borderColor: HAIR }}>
          {item.kind === 'speech' ? (
            <>
              <SpeakerAvatar name={item.speakerName} pictureUrl={item.pictureUrl} />
              <div className="min-w-0 flex-1">
                <div className="text-m font-semibold">
                  {item.speakerMemberId ? (
                    <a href={withLocale(`/members/${item.speakerMemberId}/votes/`, locale)} className="hover:opacity-80">
                      {item.speakerName}
                    </a>
                  ) : (
                    item.speakerName
                  )}
                </div>
                <div className="mt-xs flex flex-wrap items-center gap-s">
                  {item.party && <PartyBadge party={item.party} compact logoSize={16} />}
                  {item.speakerRole && <span className="text-s caption opacity-l">{item.speakerRole}</span>}
                  {item.choice && (
                    <StanceText stance={CHOICE_STANCE[item.choice]}>
                      {{ ja: t.yes, nein: t.no, enthalten: t.abstain }[item.choice]}
                    </StanceText>
                  )}
                </div>
                {(item.date || (item.voteId && item.voteTitle)) && (
                  <div className="mt-xs truncate text-s opacity-l">
                    {item.date && formatDate(item.date)}
                    {item.date && item.voteId && item.voteTitle && ' · '}
                    {item.voteId && item.voteTitle && (
                      <a href={withLocale(`/votes/${item.voteId}/`, locale)} className="hover:opacity-100">
                        {t.toVote}: {item.voteTitle}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <PartyLogo party={item.party} size={26} decorative />
              <div className="min-w-0 flex-1">
                <div className="text-m font-semibold">{partyLabel(item.party, locale)}</div>
                <div className="mt-xs">
                  <StanceText stance={item.stance}>{t.stanceLabels[item.stance]}</StanceText>
                </div>
              </div>
            </>
          )}
          <button type="button" onClick={onClose} aria-label={t.close} className="shrink-0 p-xs opacity-l hover:opacity-100">
            <X size={19} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-l">
          {item.kind === 'speech' ? (
            <div className="whitespace-pre-wrap text-l" style={{ fontFamily: SERIF, lineHeight: 1.45 }}>
              {highlight(body.data?.text || item.fallbackText, tokenize(query))}
            </div>
          ) : (
            <>
              {item.positionSummary && <p className="whitespace-pre-line text-m leading-relaxed">{item.positionSummary}</p>}
              {item.keyPoints && (
                <div className="mt-l">
                  <Markdown>{item.keyPoints}</Markdown>
                </div>
              )}
              {item.dissentNote && <p className="mt-l text-s opacity-l">{item.dissentNote}</p>}
              <p className="mt-l border-t pt-m text-s opacity-l" style={{ borderColor: HAIR }}>
                {t.partySummaryNotice}
              </p>
            </>
          )}
        </div>
        {count > 1 && (
          <footer className="flex items-center justify-between gap-m border-t px-l py-m text-s" style={{ borderColor: HAIR }}>
            <button
              type="button"
              onClick={onPrev}
              disabled={!onPrev}
              aria-label={t.previousLabel}
              className="p-xs opacity-l hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={17} />
            </button>
            <span className="opacity-l">
              {item.kind === 'speech'
                ? t.contributionOf.replace('{i}', String(index + 1)).replace('{n}', String(count))
                : `${index + 1} ${t.of} ${count}`}
            </span>
            <button
              type="button"
              onClick={onNext}
              disabled={!onNext}
              className="flex min-w-0 items-center gap-xs p-xs opacity-l hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {onNext && nextName && <span className="truncate">{t.nextLabel}: {nextName}</span>}
              <ChevronRight size={17} className="shrink-0" aria-label={t.nextLabel} />
            </button>
          </footer>
        )}
      </section>
    </div>
  )
}
