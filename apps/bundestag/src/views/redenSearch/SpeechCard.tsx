import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { PartyBadge } from '@/views/votesList/PartyBadge'
import { VoteChoicePill } from '@/views/memberDetail/VoteChoicePill'
import { useSpeechBody } from '@/hooks/useSpeechBody'
import { highlight, tokenize } from '@/lib/highlight'
import { initials } from '@/lib/initials'
import { renderSnippet } from '@/lib/snippet'
import { SERIF } from '@/lib/fonts'
import type { SpeechFeedItem } from '@/lib/speechesStatic'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

type Props = {
  speech: SpeechFeedItem
  query?: string
  pictureUrl?: string | null
}

export function SpeechCard({ speech, query = '', pictureUrl = null }: Props) {
  const terms = tokenize(query)
  const [open, setOpen] = useState(false)
  const locale = useLocale()
  const t = useCopy()
  const body = useSpeechBody(speech.ids, open, locale)
  return (
    <article
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onClick={() => setOpen((v) => !v)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setOpen((v) => !v)
        }
      }}
      className="mb-m cursor-pointer border border-fg/15 bg-background p-l shadow-[0_1px_3px_rgba(10,10,10,0.08),0_6px_16px_rgba(10,10,10,0.07)]"
    >
      <div className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-m">
        {pictureUrl ? (
          <img src={pictureUrl} alt="" className="h-[36px] w-[36px] rounded-full object-cover" />
        ) : (
          <div className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-surface text-s font-semibold opacity-l">
            {initials(speech.speakerName)}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-s">
            {speech.speakerMemberId ? (
              <a
                href={withLocale(`/members/${speech.speakerMemberId}/votes/`, locale)}
                onClick={(e) => e.stopPropagation()}
                className="relative z-10 text-m font-semibold hover:opacity-80"
              >
                {speech.speakerName}
              </a>
            ) : (
              <span className="text-m font-semibold">{speech.speakerName}</span>
            )}
            {speech.party && <PartyBadge party={speech.party} compact logoSize={16} />}
          </div>
          {speech.speakerRole && <div className="mt-xs text-s caption opacity-l">{speech.speakerRole}</div>}
        </div>
        {speech.choice ? <VoteChoicePill choice={speech.choice} /> : <span />}
      </div>
      {speech.voteId && speech.voteTitle && (
        <a
          href={withLocale(`/votes/${speech.voteId}/`, locale)}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 mt-s block text-s opacity-l hover:opacity-100"
        >
          {t.toVote}: {speech.voteTitle}
        </a>
      )}
      {open && body.data?.text ? (
        <div className="mt-s whitespace-pre-wrap text-m leading-[1.45]" style={{ fontFamily: SERIF }}>
          {highlight(body.data.text, terms)}
        </div>
      ) : speech.snippet ? (
        <div className="mt-s text-m leading-[1.45]" style={{ fontFamily: SERIF }}>{renderSnippet(speech.snippet)}</div>
      ) : (
        <div className="mt-s line-clamp-4 text-m leading-[1.45] desk:line-clamp-3" style={{ fontFamily: SERIF }}>
          {highlight(speech.excerpt, terms)}
        </div>
      )}
      <div className="mt-s flex items-center justify-between text-s opacity-l">
        <span>{open ? t.collapse : t.readFullSpeech}</span>
        <ChevronDown
          size={17}
          className="transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </div>
    </article>
  )
}
