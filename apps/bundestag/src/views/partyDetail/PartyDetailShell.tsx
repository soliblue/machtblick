import type { PartyDetail as PartyDetailData } from '@/server/partyDetail'
import type { PartyHistory } from '@/server/getPartyHistory'
import { PARTY_COLOR, hasPartyLine, isGoverning, partyLabel } from '@/lib/parties'
import { MemberStatBar } from '@/views/memberDetail/MemberStatBar'
import { AlignmentList } from './AlignmentList'
import { DonationsBar } from './DonationsBar'
import { PartyDemographics } from './PartyDemographics'
import { PartyHistoryPanel } from './PartyHistoryPanel'
import { ProposalsBar } from './ProposalsBar'
import { pct } from '@/lib/format'
import { useLocale, useCopy } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

type Props = {
  data: PartyDetailData
  history: PartyHistory
}

export function PartyDetailShell({ data, history }: Props) {
  const color = PARTY_COLOR[data.party] ?? 'var(--color-gray)'
  const locale = useLocale()
  const label = partyLabel(data.party, locale)
  const t = useCopy()
  const share = data.chamberSeats > 0 ? Math.round((data.seats / data.chamberSeats) * 100) : 0
  const status = hasPartyLine(data.party)
    ? isGoverning(data.party) ? t.government : t.opposition
    : label
  return (
    <main className="mx-auto max-w-3xl p-l">
      <div className="flex flex-col gap-l desk:flex-row desk:items-start">
        <div className="min-w-0">
          <h1 className="flex items-center gap-m font-display text-xxl font-semibold">
            <span className="inline-block size-[14px] shrink-0 rounded-full" style={{ background: color }} />
            {label}
          </h1>
          <div className="mt-s flex flex-wrap items-center gap-x-s gap-y-xs text-s caption uppercase opacity-l">
            <span>{status}</span>
            <span aria-hidden="true">/</span>
            <a
              href={`${withLocale('/members/', locale)}?party=${encodeURIComponent(data.party)}`}
              className="transition-opacity hover:opacity-70"
            >
              <span className="tabular-nums">{data.seats}</span> {t.seats}
            </a>
            <span aria-hidden="true">/</span>
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
      <div className="mt-xl flex flex-col gap-xl">
        <PartyDemographics
          demographics={data.demographics}
          party={data.party}
          membersCount={data.members.length}
        />
        {data.proposals.length > 0 ? <ProposalsBar proposals={data.proposals} party={data.party} /> : null}
        {data.alignments.length > 0 ? (
          <div>
            <div className="mb-s text-s caption opacity-l">{t.agreement}</div>
            <AlignmentList alignments={data.alignments} />
          </div>
        ) : null}
        {data.donations.length > 0 ? <DonationsBar donations={data.donations} totalEur={data.donationsTotalEur} /> : null}
        <PartyHistoryPanel
          history={history}
          partyLabel={label}
          partyColor={color}
        />
      </div>
    </main>
  )
}
