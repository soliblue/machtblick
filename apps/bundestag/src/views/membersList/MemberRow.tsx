import { Link } from '../../lib/Link'
import type { MemberListItem } from '@/server/members'
import { PartyBadge } from '@/views/votesList/PartyBadge'
import { pct } from '@/lib/format'

type Props = { member: MemberListItem }

export function MemberRow({ member }: Props) {
  return (
    <div
      className="relative grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-m border-t py-m text-m transition-opacity hover:opacity-80 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]"
      style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
    >
      <Link
        to="/members/$id/"
        params={{ id: member.id }}
        className="absolute inset-0"
        aria-label={member.name}
      />
      <span className="min-w-0 font-semibold" style={{ overflowWrap: 'anywhere' }}>{member.name}</span>
      <PartyBadge party={member.party} compact />
      <span className="hidden w-32 text-s opacity-l sm:inline">{member.state}</span>
      <span className="w-16 text-right sm:w-20">{pct(member.attendance)}</span>
      <span className="w-16 text-right sm:w-20">{member.loyalty === null ? '–' : pct(member.loyalty)}</span>
    </div>
  )
}
