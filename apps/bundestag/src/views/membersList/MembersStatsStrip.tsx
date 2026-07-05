import type { ReactNode } from 'react'
import type { MemberStats } from '@/hooks/useMemberStats'
import { GenderPie } from './GenderPie'
import { AgePie } from './AgePie'
import { PartyPie } from './PartyPie'
import { useCopy } from '@/lib/i18n'

type Props = { stats: MemberStats }

export function MembersStatsStrip({ stats }: Props) {
  const t = useCopy()
  return (
    <div role="group" aria-label={t.filteredSummary} className="grid grid-cols-2 gap-s desk:grid-cols-3 desk:gap-m">
      <Tile label={t.sex}>
        <GenderPie data={stats.gender} />
      </Tile>
      <Tile label={t.age}>
        <AgePie data={stats.age} />
      </Tile>
      <Tile label={t.parliamentaryGroup} hideOnMobile>
        <PartyPie data={stats.party} />
      </Tile>
    </div>
  )
}

function Tile({ label, children, hideOnMobile = false }: { label: string; children: ReactNode; hideOnMobile?: boolean }) {
  return (
    <div className={`${hideOnMobile ? 'hidden desk:flex' : 'flex'} flex-col p-m`}>
      <div className="mx-auto w-full max-w-[140px]">{children}</div>
      <span className="mt-s text-center text-s caption opacity-l">{label}</span>
    </div>
  )
}
