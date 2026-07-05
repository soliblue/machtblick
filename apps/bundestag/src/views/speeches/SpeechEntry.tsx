import { ChevronRight } from 'lucide-react'
import { PartyBadge } from '@/views/votesList/PartyBadge'
import { SpeakerAvatar } from './SpeakerAvatar'
import { Stamp } from '@/views/votesList/Stamp'
import { highlight, tokenize } from '@/lib/highlight'
import { renderSnippet } from '@/lib/snippet'
import { SERIF } from '@/lib/fonts'
import type { SpeechBallotChoice } from '@/lib/speechesStatic'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

export type SpeechEntrySpeech = {
  id: string
  speakerName: string
  speakerMemberId: string | null
  speakerRole: string | null
  party: string | null
  excerpt: string
  snippet?: string | null
}

type Props = {
  speech: SpeechEntrySpeech
  mode: 'card' | 'turn'
  choice?: SpeechBallotChoice | null
  pictureUrl?: string | null
  voteId?: string | null
  voteTitle?: string | null
  nested?: boolean
  query?: string
  onOpen: () => void
}

const PROSE = { fontFamily: SERIF, lineHeight: 1.45 }

export function SpeechEntry({ speech, mode, choice = null, pictureUrl = null, voteId = null, voteTitle = null, nested = false, query = '', onOpen }: Props) {
  const locale = useLocale()
  const t = useCopy()
  const terms = tokenize(query)
  const interactive = {
    role: 'button' as const,
    tabIndex: 0,
    onClick: onOpen,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onOpen()
      }
    },
  }
  const header = (
    <div className="min-w-0">
      <div className="text-m font-semibold">
        {speech.speakerMemberId ? (
          <a
            href={withLocale(`/members/${speech.speakerMemberId}/votes/`, locale)}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 hover:opacity-80"
          >
            {speech.speakerName}
          </a>
        ) : (
          speech.speakerName
        )}
      </div>
      {(speech.party || speech.speakerRole || choice) && (
        <div className="mt-xs flex flex-wrap items-center gap-s">
          {speech.party && <PartyBadge party={speech.party} compact logoSize={16} />}
          {speech.speakerRole && <span className="text-s caption opacity-l">{speech.speakerRole}</span>}
          {choice && (
            <span className="ml-auto shrink-0">
              <Stamp variant={choice === 'enthalten' ? 'enthalten' : choice} rotated={false} />
            </span>
          )}
        </div>
      )}
    </div>
  )
  const body = speech.snippet ? (
    <div className="mt-s text-m" style={PROSE}>{renderSnippet(speech.snippet)}</div>
  ) : (
    <div className={nested ? 'mt-s text-m' : 'mt-s line-clamp-4 text-m'} style={PROSE}>{highlight(speech.excerpt, terms)}</div>
  )
  const affordance = (
    <div className="mt-m flex items-center justify-between text-s opacity-l">
      <span>{t.readFullSpeech}</span>
      <ChevronRight size={17} className="shrink-0" aria-hidden="true" />
    </div>
  )
  if (mode === 'card') {
    return (
      <article
        {...interactive}
        className="mb-m cursor-pointer border border-fg/15 bg-background p-l"
      >
        <div className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-m">
          <SpeakerAvatar name={speech.speakerName} pictureUrl={pictureUrl} />
          {header}
        </div>
        {voteId && voteTitle && (
          <a
            href={withLocale(`/votes/${voteId}/`, locale)}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 mt-s block text-s opacity-l hover:opacity-100"
          >
            {t.toVote}: {voteTitle}
          </a>
        )}
        {body}
        {affordance}
      </article>
    )
  }
  if (nested) {
    return (
      <div {...interactive} className="ml-m mt-l grid cursor-pointer grid-cols-[28px_minmax(0,1fr)] gap-m">
        <SpeakerAvatar name={speech.speakerName} pictureUrl={pictureUrl} size={28} />
        <div className="min-w-0">
          <div className="text-s caption opacity-m">{t.zwischenfrage}</div>
          <div className="mt-xs">{header}</div>
          {body}
          {affordance}
        </div>
      </div>
    )
  }
  return (
    <div {...interactive} className="relative mt-xl cursor-pointer">
      <span className="absolute -left-[48px] top-0">
        <SpeakerAvatar name={speech.speakerName} pictureUrl={pictureUrl} />
      </span>
      {header}
      {body}
      {affordance}
    </div>
  )
}
