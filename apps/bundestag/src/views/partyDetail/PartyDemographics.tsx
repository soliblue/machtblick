import { ArrowRight } from 'lucide-react'
import type { PartyDemographics as Demographics } from '@/server/partyDetail'
import { StatsTile } from '@/components/StatsTile'
import { GenderPie } from '@/views/membersList/GenderPie'
import { AgePie } from '@/views/membersList/AgePie'
import { AGE_BUCKETS } from '@/lib/memberFacets'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

type Props = { demographics: Demographics; party: string; membersCount: number }

const SEX_KEYS = ['m', 'f', 'd', 'unbekannt'] as const

export function PartyDemographics({ demographics, party, membersCount }: Props) {
  const t = useCopy()
  const locale = useLocale()
  const gender = SEX_KEYS
    .filter((k) => demographics.sex[k] > 0)
    .map((k) => ({ key: k, label: t.sexLabels[k], count: demographics.sex[k] }))
    .sort((a, b) => b.count - a.count)
  const age = AGE_BUCKETS.map((k) => ({ key: k, label: t.ageLabels[k], count: demographics.age[k] }))
  return (
    <div className="">
      <div className="text-s caption opacity-l">{t.navMembers}</div>
      <div className="mt-s grid grid-cols-2 gap-s desk:max-w-[360px] desk:gap-m">
        <StatsTile label={t.sex}>
          <GenderPie data={gender} />
        </StatsTile>
        <StatsTile label={t.age}>
          <AgePie data={age} />
        </StatsTile>
      </div>
      <a
        href={`${withLocale('/members/', locale)}?party=${encodeURIComponent(party)}`}
        className="mt-m flex w-fit items-center gap-s text-s caption opacity-l transition-opacity hover:opacity-100"
      >
        {t.allMembersOf.replace('{n}', String(membersCount))}
        <ArrowRight size={14} aria-hidden="true" />
      </a>
    </div>
  )
}
