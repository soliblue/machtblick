import type { ReactNode } from 'react'
import type { MemberStats } from '@/hooks/useMemberStats'
import { GenderPie } from './GenderPie'
import { AgePie } from './AgePie'
import { PartyPie } from './PartyPie'

type Props = { stats: MemberStats }

export function MembersStatsStrip({ stats }: Props) {
  return (
    <div
      role="group"
      aria-label="Zusammenfassung der gefilterten Auswahl"
      className="grid grid-cols-2 gap-m md:grid-cols-3"
    >
      <Tile label="Geschlecht">
        <GenderPie data={stats.gender} />
      </Tile>
      <Tile label="Alter">
        <AgePie data={stats.age} />
      </Tile>
      <Tile label="Partei" hideOnMobile>
        <PartyPie data={stats.party} />
      </Tile>
    </div>
  )
}

function Tile({ label, children, hideOnMobile = false }: { label: string; children: ReactNode; hideOnMobile?: boolean }) {
  const display = hideOnMobile ? 'hidden md:flex' : 'flex'
  return (
    <div className={`${display} h-[160px] flex-col md:h-[180px]`}>
      <div className="mb-s text-s uppercase opacity-l" style={{ letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}
