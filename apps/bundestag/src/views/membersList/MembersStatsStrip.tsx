import type { MemberStats } from '@/hooks/useMemberStats'
import { StatsTile } from '@/components/StatsTile'
import { GenderPie } from './GenderPie'
import { AgePie } from './AgePie'
import { PartyPie } from './PartyPie'
import { useCopy } from '@/lib/i18n'

type Props = { stats: MemberStats }

export function MembersStatsStrip({ stats }: Props) {
  const t = useCopy()
  return (
    <div role="group" aria-label={t.filteredSummary} className="grid grid-cols-2 gap-s desk:grid-cols-3 desk:gap-m">
      <StatsTile label={t.sex}>
        <GenderPie data={stats.gender} />
      </StatsTile>
      <StatsTile label={t.age}>
        <AgePie data={stats.age} />
      </StatsTile>
      <StatsTile label={t.parliamentaryGroup} hideOnMobile>
        <PartyPie data={stats.party} />
      </StatsTile>
    </div>
  )
}
