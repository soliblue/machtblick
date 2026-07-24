import type { AntragListItem } from '@/server/antraege'
import { formatDateShort } from '@/lib/format'
import { SERIF } from '@/lib/fonts'
import { isLaenderInitiative } from '@/lib/bundeslaender'
import { motionStatusBucket } from '@/lib/motionStatus'
import { PARTY_LOGO, partyLabel } from '@/lib/parties'
import { PartyBadge } from '@/views/votesList/PartyBadge'
import { PartyDonutRow } from '@/views/votesList/PartyDonutRow'
import { Stamp } from '@/views/votesList/Stamp'
import { VoteHemicycle } from '@/views/votesList/VoteHemicycle'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'
import { FittedMotionSummary } from './FittedMotionSummary'

type Props = { antrag: AntragListItem }

export function AntragCard({ antrag }: Props) {
  const locale = useLocale()
  const t = useCopy()
  const bucket = motionStatusBucket(antrag.beratungsstand)
  const typeLabel = antrag.type === 'gesetzentwurf' ? t.bill : t.motion
  const laender = isLaenderInitiative(antrag.initiativeFraktion)
  const showLogo = !laender && !!antrag.initiativeFraktion && antrag.initiativeFraktion.split(',').some((p) => PARTY_LOGO[p.trim()])
  return (
    <article className={`group relative flex h-full min-h-0 flex-col bg-background p-l desk:min-h-[240px] ${antrag.vote ? 'desk:grid desk:grid-cols-[minmax(0,1fr)_280px] desk:gap-x-xl' : ''}`}>
      <a
        href={withLocale(`/motions/${antrag.id}/`, locale)}
        className="absolute inset-0"
        aria-label={[
          antrag.title,
          typeLabel,
          t.motionBuckets[bucket],
          ...(antrag.vote ? [t.linkedVote, antrag.vote.title, `${t.yes} ${antrag.vote.yes}`, `${t.no} ${antrag.vote.no}`] : []),
        ].join(' · ')}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-s">
          <span className="min-w-0 truncate text-s caption">
            {showLogo
              ? <PartyBadge party={antrag.initiativeFraktion} compact logoSize={17} />
              : <span className="opacity-l">{laender ? t.laender : antrag.initiativeFraktion ? partyLabel(antrag.initiativeFraktion, locale) : t.other}</span>}
          </span>
          <Stamp variant={bucket} rotated={false} />
          <span className="justify-self-end whitespace-nowrap text-s caption opacity-l">
            {antrag.vote?.date
              ? formatDateShort(antrag.vote.date, locale)
              : antrag.introducedDate
                ? formatDateShort(antrag.introducedDate, locale)
                : ''}
          </span>
        </div>
        <div className={`flex min-h-0 flex-1 flex-col ${antrag.vote ? '' : 'justify-center desk:justify-start'}`}>
          <h2
            lang={locale}
            className="mt-m shrink-0 line-clamp-4 font-display text-xl font-semibold leading-[1.15] decoration-1 underline-offset-[3px] group-hover:underline"
            style={{ hyphens: 'auto', overflowWrap: 'break-word', wordBreak: 'normal', textWrap: 'pretty' }}
          >
            {antrag.title}
          </h2>
          {antrag.summary && (antrag.vote ? (
            <FittedMotionSummary>{antrag.summary}</FittedMotionSummary>
          ) : (
            <p className="mt-m text-m leading-[1.45] desk:line-clamp-4" style={{ fontFamily: SERIF }}>{antrag.summary}</p>
          ))}
        </div>
        {antrag.vote ? (
          <span className="mt-m shrink-0 line-clamp-2 text-s leading-normal">
            <span className="caption opacity-l">{t.linkedVote}</span>
            <span className="opacity-m"> · </span>
            <span className="font-semibold">{antrag.vote.title}</span>
          </span>
        ) : (
          <span className="mt-m text-s caption opacity-l">{typeLabel}</span>
        )}
      </div>
      {antrag.vote && (
        <div className="flex shrink-0 flex-col items-center gap-l pt-m desk:pt-0">
          <VoteHemicycle
            yes={antrag.vote.yes}
            no={antrag.vote.no}
            abstain={antrag.vote.abstain}
            absent={antrag.vote.absent}
            totalMembers={antrag.vote.totalMembers}
          />
          <div className="w-full desk:max-w-[320px]">
            <PartyDonutRow partySummaries={antrag.vote.partySummaries} />
          </div>
        </div>
      )}
    </article>
  )
}
