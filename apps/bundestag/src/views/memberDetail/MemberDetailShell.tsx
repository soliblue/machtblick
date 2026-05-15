import type { ReactNode } from 'react'
import { CalendarCheck, Heart, Vote, UserX, Cake } from 'lucide-react'
import type { MemberDetail as MemberDetailData } from '@/server/members'
import { PartyBadge } from '@/views/votesList/PartyBadge'
import { pct } from '@/lib/format'
import { StatTiles } from './StatTiles'
import { MemberDetailTabs } from './MemberDetailTabs'
import { MemberPortrait } from './MemberPortrait'
import { MandateBadge } from './MandateBadge'
import { useCopy } from '@/lib/i18n'

type Props = {
  data: MemberDetailData
  children: ReactNode
}

export function MemberDetailShell({ data, children }: Props) {
  const t = useCopy()
  const tiles = [
    { label: t.attendance, value: pct(data.attendance), icon: CalendarCheck },
    { label: t.loyalty, value: data.loyalty === null ? '-' : pct(data.loyalty), icon: Heart },
    { label: t.deviations, value: String(data.defections), icon: UserX },
    { label: t.votes, value: String(data.votesAppeared), icon: Vote },
  ]
  return (
    <main className="mx-auto max-w-3xl p-l">
      <div className="mb-l flex gap-l">
        <MemberPortrait
          name={data.name}
          pictureUrl={data.pictureUrl}
          pictureAuthor={data.pictureAuthor}
          pictureLicense={data.pictureLicense}
          pictureSourceUrl={data.pictureSourceUrl}
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-xxl font-semibold">{data.name}</h1>
          <div className="mt-s flex flex-wrap items-center gap-m text-m">
            <PartyBadge party={data.party} />
            <span className="opacity-l">{data.state}</span>
          </div>
          <div className="mt-s flex flex-wrap items-center gap-m">
            {data.yearOfBirth && (
              <span className="inline-flex items-center gap-xs text-s opacity-l">
                <Cake size={14} />
                <span>{new Date().getFullYear() - data.yearOfBirth} {t.years}</span>
              </span>
            )}
            {data.mandateType && (
              <MandateBadge
                mandateType={data.mandateType}
                constituencyNumber={data.constituencyNumber}
                constituencyName={data.constituencyName}
              />
            )}
          </div>
        </div>
      </div>
      <StatTiles tiles={tiles} />
      <MemberDetailTabs memberId={data.id} />
      {children}
    </main>
  )
}
