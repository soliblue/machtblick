import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Link } from '@/lib/Link'
import { PartyBadge } from '@/views/votesList/PartyBadge'
import { VoteChoicePill } from '@/views/memberDetail/VoteChoicePill'
import { useSpeechBody } from '@/hooks/useSpeechBody'
import { highlight, tokenize } from '@/lib/highlight'
import { initials } from '@/lib/initials'
import { renderSnippet } from '@/lib/snippet'
import type { MemberVoteRow } from '@/server/members'
import type { SpeechResult, SpeechSummary } from '@/server/speeches'
import { useLocale } from '@/lib/i18n'

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
  pictureUrl?: string | null
  choice?: MemberVoteRow['choice'] | null
}

export function SpeechRow({ speech, query = '', showVoteLink = true, pictureUrl, choice }: Props) {
  const terms = tokenize(query)
  const [open, setOpen] = useState(false)
  const locale = useLocale()
  const body = useSpeechBody(speech.id, open, locale)
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
      className="cursor-pointer border-t py-m"
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
          </div>
          {showVoteLink && speech.voteId && speech.voteTitle && (
            <Link
              to="/votes/$id/"
              params={{ id: speech.voteId }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 mt-xs block text-s opacity-l hover:opacity-100"
            >
              Abstimmung: {speech.voteTitle}
            </Link>
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
  if (speech.speakerMemberId) {
    return (
      <Link
        to="/members/$id/"
        params={{ id: speech.speakerMemberId }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 font-semibold hover:opacity-80"
      >
        {speech.speakerName}
      </Link>
    )
  }
  return <span className="font-semibold">{speech.speakerName}</span>
}

export type { RowSpeech, SpeechResult }
