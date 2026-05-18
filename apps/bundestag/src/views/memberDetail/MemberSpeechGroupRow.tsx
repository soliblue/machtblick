import { ChevronDown } from 'lucide-react'
import { PartyBadge } from '@/views/votesList/PartyBadge'
import { formatDate } from '@/lib/format'
import { highlight } from '@/lib/highlight'
import { withLocale } from '@/lib/locale'
import { makeSnippet, renderSnippet } from '@/lib/snippet'
import { useLocale } from '@/lib/i18n'
import type { SpeechResult } from '@/server/speeches'
import type { SpeechMetaEntry } from '@/lib/speechesStatic'
import type { MemberSpeechGroup } from '@/hooks/memberSpeechGroups'

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

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
  const memberSpeechIds = new Set(group.speeches.map((speech) => speech.id))
  const timelineRows: Array<SpeechResult | SpeechMetaEntry> = contextRows?.length ? contextRows : group.speeches
  const matchedSpeeches = terms.length
    ? group.speeches.filter((speech) => terms.every((term) => `${speech.speakerName} ${texts?.[speech.id] ?? speech.excerpt}`.toLowerCase().includes(term)))
    : []
  const contributionLabel = locale === 'en'
    ? `${group.speeches.length} ${group.speeches.length === 1 ? 'contribution' : 'contributions'}`
    : `${group.speeches.length} ${group.speeches.length === 1 ? 'Beitrag' : 'Beiträge'}`
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
            <div className="flex flex-wrap items-center gap-s">
              <span className="font-semibold">{formatDate(group.date)}</span>
              {group.voteId && group.voteTitle ? (
                <a
                  href={withLocale(`/votes/${group.voteId}/`, locale)}
                  onClick={(event) => event.stopPropagation()}
                  className="relative z-10 text-m hover:opacity-80"
                >
                  {group.voteTitle}
                </a>
              ) : group.agendaTitle ? (
                <span className="text-m">{group.agendaTitle}</span>
              ) : group.agendaItem ? (
                <span className="text-s opacity-l">{group.agendaItem}</span>
              ) : null}
              {group.main.party && <PartyBadge party={group.main.party} compact />}
            </div>
            <div className="mt-xs flex flex-wrap items-center gap-s text-s opacity-l">
              <span>{contributionLabel}</span>
              {shortLabel && <span>{shortLabel}</span>}
            </div>
          </div>
          <ChevronDown
            size={17}
            className="mt-xs opacity-l transition-transform"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
        {terms.length && matchedSpeeches.length ? (
          <div className="mt-s flex flex-col gap-xs text-m opacity-l">
            {matchedSpeeches.slice(0, 2).map((speech) => {
              const body = texts?.[speech.id] ?? speech.excerpt
              const snippet = makeSnippet(body, terms)
              return <div key={speech.id}>{snippet ? renderSnippet(snippet) : highlight(body, terms)}</div>
            })}
          </div>
        ) : (
          <div className="mt-s text-m opacity-l line-clamp-2">{highlight(group.main.excerpt, terms)}</div>
        )}
      </div>
      {open && (
        <div className="mt-m pl-m">
          <div className="mb-s text-s opacity-l">{locale === 'en' ? 'Exchange' : 'Verlauf'}</div>
          {contextLoading && !contextRows ? (
            <div className="text-m opacity-l">{locale === 'en' ? 'Loading context...' : 'Kontext wird geladen...'}</div>
          ) : (
            <div className="flex flex-col gap-m">
              {timelineRows.map((speech) => {
                const isMember = memberSpeechIds.has(speech.id)
                const body = texts?.[speech.id] ?? speech.excerpt
                return (
                  <div key={speech.id} className={isMember ? 'opacity-100' : 'opacity-l'}>
                    <div className="flex flex-wrap items-center gap-s text-s">
                      <span className={isMember ? 'font-semibold' : ''}>{speech.speakerName}</span>
                      {speech.speakerRole ? <span className="opacity-l">{speech.speakerRole}</span> : speech.party ? <PartyBadge party={speech.party} compact /> : null}
                    </div>
                    <div className={isMember ? 'mt-xs whitespace-pre-wrap text-m' : 'mt-xs text-m line-clamp-3'}>
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
