import { ChevronRight } from 'lucide-react'
import { PartyBadge } from '@/views/votesList/PartyBadge'
import { SpeakerAvatar } from './SpeakerAvatar'
import { Stamp } from '@/views/votesList/Stamp'
import { highlight, tokenize } from '@/components/highlight'
import { renderSnippet } from '@/components/snippet'
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
  choice?: SpeechBallotChoice | null
  pictureUrl?: string | null
  voteId?: string | null
  voteTitle?: string | null
  query?: string
  onOpen: () => void
}

const PROSE = { fontFamily: SERIF, lineHeight: 1.45 }

export function SpeechEntry({ speech, choice = null, pictureUrl = null, voteId = null, voteTitle = null, query = '', onOpen }: Props) {
  const locale = useLocale()
  const t = useCopy()
  const terms = tokenize(query)
  return (
    <article className="relative mb-m rounded-m border border-fg/15 bg-background p-l">
      <button
        type="button"
        onClick={onOpen}
        aria-label={[t.openSpeechOf.replace('{name}', speech.speakerName), ...(voteTitle ? [voteTitle] : [])].join(' · ')}
        className="absolute inset-0 cursor-pointer"
      />
      <div className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-m">
        <SpeakerAvatar name={speech.speakerName} pictureUrl={pictureUrl} />
        <div className="min-w-0">
          <div className="text-m font-semibold">
            {speech.speakerMemberId ? (
              <a
                href={withLocale(`/members/${speech.speakerMemberId}/votes/`, locale)}
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
      </div>
      {voteId && voteTitle && (
        <a
          href={withLocale(`/votes/${voteId}/`, locale)}
          className="relative z-10 mt-s block text-s opacity-l hover:opacity-100"
        >
          {t.toVote}: {voteTitle}
        </a>
      )}
      {speech.snippet ? (
        <div className="mt-s text-m" style={PROSE}>{renderSnippet(speech.snippet)}</div>
      ) : (
        <div className="mt-s line-clamp-4 text-m" style={PROSE}>{highlight(speech.excerpt, terms)}</div>
      )}
      <div className="mt-m flex items-center justify-between text-s opacity-l">
        <span>{t.readFullSpeech}</span>
        <ChevronRight size={17} className="shrink-0" aria-hidden="true" />
      </div>
    </article>
  )
}
