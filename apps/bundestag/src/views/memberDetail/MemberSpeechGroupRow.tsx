import { ChevronDown, ExternalLink } from 'lucide-react'
import { PartyLogo } from '@/views/votesList/PartyLogo'
import { formatDateShort } from '@/lib/format'
import { SERIF } from '@/lib/fonts'
import { highlight } from '@/lib/highlight'
import { withLocale } from '@/lib/locale'
import { makeSnippet, renderSnippet } from '@/lib/snippet'
import { useCopy, useLocale } from '@/lib/i18n'
import type { SpeechResult } from '@/server/speeches'
import type { SpeechMetaEntry } from '@/lib/speechesStatic'
import type { MemberSpeechGroup } from '@/hooks/memberSpeechGroups'

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 8%, transparent)'
const PROSE = { fontFamily: SERIF, lineHeight: 1.45 }

type Props = {
  group: MemberSpeechGroup
  open: boolean
  onToggle: () => void
  terms: string[]
  texts?: Record<string, string>
  contextRows?: SpeechMetaEntry[]
  contextLoading: boolean
}

export function MemberSpeechGroupRow({ group, open, onToggle, terms, texts, contextRows, contextLoading }: Props) {
  const locale = useLocale()
  const t = useCopy()
  const memberSpeechIds = new Set(group.speeches.map((speech) => speech.id))
  const timelineRows: Array<SpeechResult | SpeechMetaEntry> = contextRows?.length ? contextRows : group.speeches
  const matchedSpeeches = terms.length
    ? group.speeches.filter((speech) => terms.every((term) => `${speech.speakerName} ${texts?.[speech.id] ?? speech.excerpt}`.toLowerCase().includes(term)))
    : []
  const contributions = `${group.speeches.length} ${group.speeches.length === 1 ? t.contribution : t.contributions}`
  const shortLabel = group.shortCount > 0
    ? locale === 'en'
      ? `${group.shortCount} short`
      : `${group.shortCount} kurz`
    : null
  return (
    <div className="border-t py-m" style={{ borderColor: ROW_BORDER }}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onToggle()
          }
        }}
        className="cursor-pointer"
      >
        <div className="grid grid-cols-[1fr_auto] items-start gap-m">
          <div className="min-w-0">
            <div className="font-display text-l font-semibold" style={{ overflowWrap: 'anywhere' }}>
              {group.voteTitle ?? group.agendaTitle ?? group.agendaItem ?? (locale === 'en' ? 'Speech' : 'Rede')}
            </div>
            <div className="mt-s flex flex-wrap items-center gap-x-s gap-y-xs text-s caption">
              <span className="opacity-l">{formatDateShort(group.date, locale)}</span>
              <span className="opacity-l" aria-hidden="true">·</span>
              <span className="opacity-l">{contributions}</span>
              {shortLabel && (
                <>
                  <span className="opacity-l" aria-hidden="true">·</span>
                  <span className="opacity-l">{shortLabel}</span>
                </>
              )}
              {group.voteId && (
                <>
                  <span className="opacity-l" aria-hidden="true">·</span>
                  <a
                    href={withLocale(`/votes/${group.voteId}/`, locale)}
                    onClick={(event) => event.stopPropagation()}
                    className="relative z-10 inline-flex items-center gap-xs opacity-l hover:opacity-100"
                  >
                    {locale === 'en' ? 'Vote' : 'Abstimmung'}
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                </>
              )}
            </div>
          </div>
          <ChevronDown
            size={17}
            className="mt-xs opacity-l transition-transform"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
        {open ? null : terms.length && matchedSpeeches.length ? (
          <div className="mt-s flex flex-col gap-xs text-m opacity-l" style={PROSE}>
            {matchedSpeeches.slice(0, 2).map((speech) => {
              const body = texts?.[speech.id] ?? speech.excerpt
              const snippet = makeSnippet(body, terms)
              return <div key={speech.id}>{snippet ? renderSnippet(snippet) : highlight(body, terms)}</div>
            })}
          </div>
        ) : (
          <div className="mt-s text-m opacity-l line-clamp-2" style={PROSE}>{highlight(group.main.excerpt, terms)}</div>
        )}
      </div>
      {open && (
        <div className="mt-m">
          {contextLoading && !contextRows ? (
            <div className="text-m opacity-l">{locale === 'en' ? 'Loading context...' : 'Kontext wird geladen...'}</div>
          ) : (
            <div className="flex flex-col gap-m">
              {timelineRows.map((speech) => {
                const isMember = memberSpeechIds.has(speech.id)
                const body = texts?.[speech.id] ?? speech.excerpt
                return (
                  <div key={speech.id} className={isMember ? 'opacity-100' : 'opacity-l'}>
                    <div className="flex flex-wrap items-center gap-s text-s caption">
                      <span className={isMember ? 'font-semibold' : ''}>{speech.speakerName}</span>
                      {speech.speakerRole ? <span className="opacity-l">{speech.speakerRole}</span> : speech.party ? <PartyLogo party={speech.party} size={17} decorative /> : null}
                    </div>
                    <div className={isMember ? 'mt-xs whitespace-pre-wrap text-m' : 'mt-xs text-m line-clamp-3'} style={PROSE}>
                      {highlight(body, terms)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
