import type { ReactNode } from 'react'
import type { MemberDetail as MemberDetailData } from '@/server/memberDetail'
import { pct } from '@/lib/format'
import { hasPartyLine, partyLabel } from '@/lib/parties'
import { MemberDetailTabs } from './MemberDetailTabs'
import { MemberPortrait } from './MemberPortrait'
import { MemberStatBar } from './MemberStatBar'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'
import { groupMemberSpeeches } from '@/hooks/memberSpeechGroups'

type Props = {
  data: MemberDetailData
  children: ReactNode
}

export function MemberDetailShell({ data, children }: Props) {
  const t = useCopy()
  const locale = useLocale()
  const speechGroups = groupMemberSpeeches(data.speeches)
  const missed = data.history.filter((r) => r.choice === 'nicht_abgegeben').length
  const meta = [
    partyLabel(data.party, locale),
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
          <h1 className="font-display text-xxl font-semibold">
            <span style={{ overflowWrap: 'anywhere' }}>{data.name}</span>
          </h1>
          <div className="mt-s flex flex-col gap-xs text-s caption opacity-l">
            {meta.map((item, i) => (
              <span key={`${item}-${i}`} style={{ overflowWrap: 'anywhere' }}>{item}</span>
            ))}
          </div>
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-l desk:col-span-1 desk:col-start-2">
          <MemberStatBar
            label={t.attendance}
            value={pct(data.attendance)}
            sub={<span className="opacity-l">{missed} {t.of} {data.history.length} {t.missed}</span>}
          />
          {data.loyalty === null ? (
            <div className="min-w-0">
              <div className="text-s caption opacity-l">{t.loyalty}</div>
              <div className="mt-xs text-s caption opacity-l">{hasPartyLine(data.party) ? t.noVoteData : t.noPartyLine}</div>
            </div>
          ) : (
            <MemberStatBar
              label={t.loyalty}
              value={pct(data.loyalty)}
              sub={
                data.defections > 0 ? (
                  <a
                    href={`${withLocale(`/members/${data.id}/votes/`, locale)}?line=abw`}
                    className="font-semibold text-danger transition-opacity hover:opacity-80"
                  >
                    {data.defections} {t.deviations} ›
                  </a>
                ) : (
                  <span className="opacity-l">0 {t.deviations}</span>
                )
              }
            />
          )}
        </div>
      </div>
      <MemberDetailTabs memberId={data.id} votes={data.history.length} speeches={speechGroups.length} proposals={data.initiatives.length} />
      {children}
    </main>
  )
}
