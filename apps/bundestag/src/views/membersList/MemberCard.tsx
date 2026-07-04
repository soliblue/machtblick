import type { MemberListItem } from '@/server/members'
import { PartyLogo } from '@/views/votesList/PartyLogo'
import { initials } from '@/lib/initials'
import { pct } from '@/lib/format'
import { partyLabel } from '@/lib/parties'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

type Props = { member: MemberListItem }

export function MemberCard({ member }: Props) {
  const t = useCopy()
  const locale = useLocale()
  return (
    <div className="relative flex flex-col border border-fg/15 bg-background shadow-[0_1px_3px_rgba(10,10,10,0.08),0_6px_16px_rgba(10,10,10,0.07)] transition-opacity hover:opacity-80">
      <a
        href={withLocale(`/members/${member.id}/votes/`, locale)}
        className="absolute inset-0 z-10"
        aria-label={`${member.name}, ${partyLabel(member.party, locale)}, ${member.state}, ${t.attendance} ${pct(member.attendance)}`}
      />
      {member.pictureUrl ? (
        <img src={member.pictureUrl} alt="" loading="lazy" decoding="async" className="aspect-square w-full object-cover" />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center bg-surface">
          <span className="text-xl font-semibold opacity-m">{initials(member.name)}</span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-m">
        <p className="min-h-[2lh] text-m font-semibold line-clamp-2" style={{ overflowWrap: 'anywhere' }}>{member.name}</p>
        <p className="mt-xs flex min-w-0 items-center gap-xs text-s">
          <PartyLogo party={member.party} size={17} decorative />
          <span className="truncate opacity-l">{member.state}</span>
        </p>
        <div className="mt-m flex items-baseline justify-between gap-s">
          <span className="text-s caption opacity-l">{t.attendance}</span>
          <span className="text-s font-semibold tabular-nums">{pct(member.attendance)}</span>
        </div>
        <div className="mt-xs h-[3px] w-full bg-fg/15">
          <div className="h-full bg-success" style={{ width: pct(member.attendance) }} />
        </div>
        <div className="mt-s flex items-baseline justify-between gap-s">
          <span className="text-s caption opacity-l">{t.line}</span>
          <span className="text-s font-semibold tabular-nums">{member.loyalty === null ? '-' : pct(member.loyalty)}</span>
        </div>
      </div>
    </div>
  )
}
