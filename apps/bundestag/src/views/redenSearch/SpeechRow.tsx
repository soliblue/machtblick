import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Link } from '@/lib/Link'
import { PartyBadge } from '@/views/votesList/PartyBadge'
import { useSpeechBody } from '@/hooks/useSpeechBody'
import { highlight, tokenize } from '@/lib/highlight'
import { renderSnippet } from '@/lib/snippet'
import type { SpeechResult, SpeechSummary } from '@/server/speeches'

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
}

export function SpeechRow({ speech, query = '', showVoteLink = true }: Props) {
  const terms = tokenize(query)
  const [open, setOpen] = useState(false)
  const body = useSpeechBody(speech.id, open)
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
      <div className="grid grid-cols-[1fr_auto] items-start gap-m">
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
        <ChevronDown
          size={17}
          className="opacity-l transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </div>
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
