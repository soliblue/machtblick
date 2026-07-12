import type { ReactNode } from 'react'
import type { MemberDetail as MemberDetailData } from '@/server/memberDetail'
import { pct } from '@/lib/format'
import { hasPartyLine, PARTY_LOGO, partyLabel } from '@/lib/parties'
import { withLocale } from '@/lib/locale'
import { MemberDetailTabs } from './MemberDetailTabs'
import { MemberPortrait } from './MemberPortrait'
import { MemberStatValue } from './MemberStatValue'
import { useCopy, useLocale } from '@/lib/i18n'
import { groupMemberSpeeches } from '@/lib/memberSpeechGroups'
import { PartyLogo } from '@/views/votesList/PartyLogo'

type Props = {
  data: MemberDetailData
  deviationsOnly: boolean
  children: ReactNode
}

export function MemberDetailShell({ data, deviationsOnly, children }: Props) {
  const t = useCopy()
  const locale = useLocale()
  const speechGroups = groupMemberSpeeches(data.speeches)
  const missed = data.history.filter((r) => r.choice === 'nicht_abgegeben').length
  const meta = [
    ...(data.state ? [data.state] : []),
    ...(data.mandateType ? [t.mandateLabels[data.mandateType]] : []),
    ...(data.mandateType === 'direkt' && data.constituencyName ? [data.constituencyName] : []),
    ...(data.yearOfBirth ? [`${new Date().getFullYear() - data.yearOfBirth} ${t.years}`] : []),
    ...(data.education ? [data.education] : []),
  ]
  return (
    <main className="mx-auto max-w-3xl px-l pb-[64px] pt-l">
      <div className="mb-l grid grid-cols-[112px_minmax(0,1fr)] gap-l desk:grid-cols-[128px_minmax(0,1fr)]">
        <div className="desk:row-span-2">
          <MemberPortrait
            name={data.name}
            pictureUrl={data.pictureUrl}
            pictureAuthor={data.pictureAuthor}
            pictureLicense={data.pictureLicense}
            pictureSourceUrl={data.pictureSourceUrl}
          />
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-s">
            {PARTY_LOGO[data.party] ? (
              <PartyLogo party={data.party} size={19} />
            ) : (
              <span className="shrink-0 text-s caption opacity-l">{partyLabel(data.party, locale)}</span>
            )}
            <h1 className="min-w-0 font-display text-xxl font-semibold">
              <span style={{ overflowWrap: 'anywhere' }}>{data.name}</span>
            </h1>
          </div>
          <div className="mt-s flex flex-col gap-xs text-s caption opacity-l">
            {meta.map((item, i) => (
              <span key={`${item}-${i}`} style={{ overflowWrap: 'anywhere' }}>{item}</span>
            ))}
          </div>
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-s desk:col-span-1 desk:col-start-2 desk:max-w-[360px]">
          <MemberStatValue
            label={t.attendance}
            value={pct(data.attendance)}
            sub={<span className="opacity-l">{missed} {t.of} {data.history.length} {t.missed}</span>}
          />
          <MemberStatValue
            label={t.loyalty}
            value={data.loyalty === null ? '-' : pct(data.loyalty)}
            sub={data.loyalty === null ? (
              <span className="opacity-l">{hasPartyLine(data.party) ? t.noVoteData : t.noPartyLine}</span>
            ) : data.defections > 0 ? (
              <a
                href={`${withLocale(`/members/${data.id}/votes/`, locale)}${deviationsOnly ? '' : '?line=abw'}`}
                aria-current={deviationsOnly ? 'true' : undefined}
                className={`text-danger transition-opacity hover:opacity-100 ${deviationsOnly ? 'font-semibold' : 'font-regular opacity-l'}`}
              >
                {data.defections} {t.deviations}
              </a>
            ) : (
              <span className="opacity-l">0 {t.deviations}</span>
            )}
          />
        </div>
      </div>
      <MemberDetailTabs memberId={data.id} votes={data.history.length} speeches={speechGroups.length} />
      {children}
    </main>
  )
}
