import type { AntragListItem } from '@/server/antraege'
import { formatDateShort } from '@/lib/format'
import { SERIF } from '@/lib/fonts'
import { isLaenderInitiative } from '@/lib/bundeslaender'
import { motionStatusBucket } from '@/lib/motionStatus'
import { PARTY_LOGO, partyLabel } from '@/lib/parties'
import { PartyBadge } from '@/views/votesList/PartyBadge'
import { VerdictChip } from '@/components/VerdictChip'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

type Props = { antrag: AntragListItem }

export function AntragCard({ antrag }: Props) {
  const locale = useLocale()
  const t = useCopy()
  const bucket = motionStatusBucket(antrag.beratungsstand)
  const decided = bucket === 'angenommen' || bucket === 'abgelehnt'
  const accepted = bucket === 'angenommen'
  const chipLabel = !accepted ? t.rejected : antrag.beratungsstand === 'Verkündet' ? t.motionStatus['Verkündet'] : t.accepted
  const typeLabel = antrag.type === 'gesetzentwurf' ? t.bill : t.motion
  const laender = isLaenderInitiative(antrag.initiativeFraktion)
  const showLogo = !laender && !!antrag.initiativeFraktion && antrag.initiativeFraktion.split(',').some((p) => PARTY_LOGO[p.trim()])
  return (
    <article
      className="group relative mb-m overflow-hidden rounded-m border border-fg/15 bg-background p-l"
      style={decided ? { borderTop: `3px solid ${accepted ? 'var(--color-success)' : 'var(--color-danger)'}` } : undefined}
    >
      <a
        href={withLocale(`/motions/${antrag.id}/`, locale)}
        className="absolute inset-0"
        aria-label={[antrag.title, typeLabel, decided ? chipLabel : t.motionBuckets[bucket]].join(' · ')}
      />
      {decided && <VerdictChip accepted={accepted}>{chipLabel}</VerdictChip>}
      <p className="flex min-w-0 items-center gap-s overflow-hidden text-s caption">
        <span className="min-w-0 truncate">
          {showLogo
            ? <PartyBadge party={antrag.initiativeFraktion} compact logoSize={17} />
            : <span className="opacity-l">{laender ? t.laender : antrag.initiativeFraktion ? partyLabel(antrag.initiativeFraktion, locale) : t.other}</span>}
        </span>
        {antrag.introducedDate && (
          <>
            <span className="opacity-m">·</span>
            <span className="shrink-0 whitespace-nowrap opacity-l">{formatDateShort(antrag.introducedDate, locale)}</span>
          </>
        )}
        <span className="opacity-m">·</span>
        <span className="shrink-0 whitespace-nowrap opacity-l">{typeLabel}</span>
        {!decided && <span className="ml-auto shrink-0 whitespace-nowrap opacity-l">{t.motionBuckets[bucket]}</span>}
      </p>
      <h2
        lang={locale}
        className="mt-s line-clamp-3 font-display text-xl font-semibold leading-[1.15] decoration-1 underline-offset-[3px] group-hover:underline desk:line-clamp-2"
        style={{ textWrap: 'pretty' }}
      >
        {antrag.title}
      </h2>
      {antrag.summary && (
        <p className="mt-s line-clamp-3 text-m leading-[1.45]" style={{ fontFamily: SERIF }}>{antrag.summary}</p>
      )}
      {antrag.vote && (
        <div className="mt-m flex items-baseline gap-l">
          <span className="tabular-nums">
            <span className="text-s caption opacity-l">{t.yes}</span>{' '}
            <span className="text-m font-semibold" style={{ color: 'var(--color-success)' }}>{antrag.vote.yes}</span>
          </span>
          <span className="tabular-nums">
            <span className="text-s caption opacity-l">{t.no}</span>{' '}
            <span className="text-m font-semibold" style={{ color: 'var(--color-danger)' }}>{antrag.vote.no}</span>
          </span>
          <span className="ml-auto text-s opacity-l">{formatDateShort(antrag.vote.date, locale)}</span>
        </div>
      )}
    </article>
  )
}
