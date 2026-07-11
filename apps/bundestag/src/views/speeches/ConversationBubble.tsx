import { PartyLogo } from '@/views/votesList/PartyLogo'
import { PARTY_COLOR } from '@/lib/parties'
import { SERIF } from '@/lib/fonts'
import { highlight, tokenize } from '@/lib/highlight'
import { withLocale } from '@/lib/locale'
import { renderSnippet } from '@/lib/snippet'
import { useCopy, useLocale } from '@/lib/i18n'
import { SpeakerAvatar } from './SpeakerAvatar'
import type { SpeechEntrySpeech } from './SpeechEntry'

export type ConversationBubbleSpeech = SpeechEntrySpeech & {
  contributionType?: string | null
}

type Props = {
  speech: ConversationBubbleSpeech
  pictureUrl?: string | null
  expanded: boolean
  fullText?: string | null
  loading?: boolean
  query?: string
  highlighted?: boolean
  highlightColor?: string
  onExpand: () => void
  onCollapse: () => void
  onOpenReader?: () => void
}

const PROSE = { fontFamily: SERIF, lineHeight: 1.45 }

export function ConversationBubble({
  speech,
  pictureUrl = null,
  expanded,
  fullText = null,
  loading = false,
  query = '',
  highlighted = false,
  highlightColor = 'var(--color-fg)',
  onExpand,
  onCollapse,
  onOpenReader,
}: Props) {
  const locale = useLocale()
  const t = useCopy()
  const terms = tokenize(query)
  const partyColor = speech.party ? PARTY_COLOR[speech.party] : null
  const canExpand = speech.contributionType !== 'short'
  const text = expanded ? fullText || speech.excerpt : speech.excerpt
  return (
    <article
      className="rounded-m p-m"
      style={{
        background: partyColor ? `color-mix(in oklab, ${partyColor} 13%, var(--color-background))` : 'var(--color-surface)',
        boxShadow: highlighted ? `0 0 0 2px color-mix(in oklab, ${highlightColor} 70%, transparent)` : undefined,
      }}
    >
      <header className="flex items-center gap-s">
        <div className="flex min-w-0 flex-1 items-center gap-s">
          <SpeakerAvatar name={speech.speakerName} pictureUrl={pictureUrl} size={24} />
          <div className="min-w-0 truncate text-l font-semibold">
            {speech.speakerMemberId ? (
              <a href={withLocale(`/members/${speech.speakerMemberId}/votes/`, locale)} className="hover:opacity-80">
                {speech.speakerName}
              </a>
            ) : (
              speech.speakerName
            )}
          </div>
        </div>
        {speech.party && <PartyLogo party={speech.party} size={17} decorative />}
      </header>
      <div className={expanded ? 'mt-s whitespace-pre-wrap text-l' : 'mt-s line-clamp-6 whitespace-pre-wrap text-l'} style={PROSE}>
        {speech.snippet && !expanded ? renderSnippet(speech.snippet) : highlight(text, terms)}
      </div>
      {expanded && loading && !fullText && <div className="mt-s text-s opacity-l">{t.searchIndexLoading}</div>}
      {canExpand && (
        <div className="mt-s flex flex-wrap items-center gap-m text-s font-semibold">
          {expanded ? (
            <button type="button" onClick={onCollapse} className="hover:opacity-80" style={{ color: partyColor ?? 'var(--color-fg)' }}>
              {t.collapse}
            </button>
          ) : (
            <button type="button" onClick={onExpand} className="hover:opacity-80" style={{ color: partyColor ?? 'var(--color-fg)' }}>
              {t.showMore}
            </button>
          )}
          {expanded && !loading && !fullText && onOpenReader && (
            <button type="button" onClick={onOpenReader} className="opacity-l hover:opacity-100">
              {t.readFullSpeech}
            </button>
          )}
        </div>
      )}
    </article>
  )
}
