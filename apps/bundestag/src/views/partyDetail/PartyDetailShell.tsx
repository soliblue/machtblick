import type { ReactNode } from 'react'
import type { PartyDetail as PartyDetailData } from '@/server/partyDetail'
import { PARTY_COLOR, PARTY_LOGO, hasPartyLine, isGoverning, partyLabel } from '@/lib/parties'
import { PartyLogo } from '@/views/votesList/PartyLogo'
import { MemberStatBar } from '@/views/memberDetail/MemberStatBar'
import { PartyDetailTabs } from './PartyDetailTabs'
import { pct } from '@/lib/format'
import { useLocale, useCopy } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

type Props = {
  data: PartyDetailData
  children: ReactNode
}

export function PartyDetailShell({ data, children }: Props) {
  const color = PARTY_COLOR[data.party] ?? 'var(--color-gray)'
  const locale = useLocale()
  const label = partyLabel(data.party, locale)
  const t = useCopy()
  const share = data.chamberSeats > 0 ? Math.round((data.seats / data.chamberSeats) * 100) : 0
  return (
    <main className="mx-auto max-w-3xl p-l">
      <div className="flex flex-col gap-l desk:flex-row desk:items-start">
        <div className="min-w-0">
          <h1 className="flex items-center gap-m font-display text-xxl font-semibold">
            {PARTY_LOGO[data.party] ? (
              <PartyLogo party={data.party} size={44} decorative />
            ) : (
              <span className="inline-block size-6 shrink-0" style={{ background: color }} />
            )}
            {label}
          </h1>
          <div className="mt-s flex flex-wrap items-center gap-x-s gap-y-xs text-s caption opacity-l">
            {hasPartyLine(data.party) && (
              <>
                <span>{isGoverning(data.party) ? t.government : t.opposition}</span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <a
              href={`${withLocale('/members/', locale)}?party=${encodeURIComponent(data.party)}`}
              className="transition-opacity hover:opacity-70"
            >
              <span className="tabular-nums">{data.seats}</span> {t.seats}
            </a>
            <span aria-hidden="true">·</span>
            <span><span className="tabular-nums">{share} %</span> {t.ofBundestag}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-l desk:ml-auto desk:w-[416px] desk:shrink-0">
          <MemberStatBar
            label={t.cohesion}
            value={pct(data.cohesion)}
            sub={<span className="opacity-l"><span className="tabular-nums">{data.votes.length}</span> {t.votes}</span>}
          />
          <MemberStatBar label={t.attendance} value={pct(data.attendance)} />
        </div>
      </div>
      <PartyDetailTabs partyId={data.slug} votes={data.votes.length} />
      {children}
    </main>
  )
}
