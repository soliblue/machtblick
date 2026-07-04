import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { PartyBadge } from '@/views/votesList/PartyBadge'
import { VoteChoicePill } from '@/views/memberDetail/VoteChoicePill'
import { useSpeechBody } from '@/hooks/useSpeechBody'
import { highlight, tokenize } from '@/lib/highlight'
import { initials } from '@/lib/initials'
import { renderSnippet } from '@/lib/snippet'
import type { MemberVoteRow } from '@/server/memberDetail'
import type { SpeechResult, SpeechSummary } from '@/server/speeches'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'
import { formatDate } from '@/lib/format'

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

type RowSpeech = SpeechSummary & {
  voteId?: string | null
  voteTitle?: string | null
  snippet?: string | null
}

type Props = {
  speech: RowSpeech
  query?: string
  showVoteLink?: boolean
  showDate?: boolean
  pictureUrl?: string | null
  choice?: MemberVoteRow['choice'] | null
  withDivider?: boolean
}

export function SpeechRow({ speech, query = '', showVoteLink = true, showDate = false, pictureUrl, choice, withDivider = true }: Props) {
  const terms = tokenize(query)
  const [open, setOpen] = useState(false)
  const locale = useLocale()
  const t = useCopy()
  const body = useSpeechBody([speech.id], open, locale)
  const withAvatar = pictureUrl !== undefined || choice !== undefined
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
      className={withDivider ? 'cursor-pointer border-t py-m' : 'cursor-pointer pb-m'}
      style={{ borderColor: ROW_BORDER }}
    >
      <div
        className={
          withAvatar
            ? 'grid grid-cols-[36px_1fr_auto_auto] items-center gap-m'
            : 'grid grid-cols-[1fr_auto] items-center gap-m'
        }
      >
        {withAvatar && (
          pictureUrl ? (
            <img src={pictureUrl} alt={speech.speakerName} className="h-[36px] w-[36px] rounded-full object-cover" />
          ) : (
            <div className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-surface text-s font-semibold opacity-l">
              {initials(speech.speakerName)}
            </div>
          )
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-s">
            <SpeakerName speech={speech} />
            {speech.speakerRole
              ? <span className="text-s opacity-l">{speech.speakerRole}</span>
              : <PartyBadge party={speech.party} compact />}
            {showDate && <span className="text-s opacity-l">{formatDate(speech.date)}</span>}
          </div>
          {showVoteLink && speech.voteId && speech.voteTitle && (
            <a
              href={withLocale(`/votes/${speech.voteId}/`, locale)}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 mt-xs block text-s opacity-l hover:opacity-100"
            >
              {t.vote}: {speech.voteTitle}
            </a>
          )}
        </div>
        {withAvatar && (choice ? <VoteChoicePill choice={choice} /> : <span />)}
        <ChevronDown
          size={17}
          className="opacity-l transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </div>
      {open && body.data ? (
        <div className="mt-s text-m opacity-l whitespace-pre-wrap">{highlight(body.data.text, terms)}</div>
      ) : speech.snippet ? (
        <div className="mt-s text-m opacity-l">{renderSnippet(speech.snippet)}</div>
      ) : (
        <div className={open ? 'mt-s text-m opacity-l' : 'mt-s text-m opacity-l line-clamp-2'}>
          {highlight(speech.excerpt, terms)}
        </div>
      )}
    </div>
  )
}

function SpeakerName({ speech }: { speech: SpeechSummary }) {
  const locale = useLocale()
  if (speech.speakerMemberId) {
    return (
      <a
        href={withLocale(`/members/${speech.speakerMemberId}/votes/`, locale)}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 font-semibold hover:opacity-80"
      >
        {speech.speakerName}
      </a>
    )
  }
  return <span className="font-semibold">{speech.speakerName}</span>
}

export type { RowSpeech, SpeechResult }
