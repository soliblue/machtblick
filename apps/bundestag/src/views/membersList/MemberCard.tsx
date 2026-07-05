import type { MemberListItem } from '@/server/members'
import { PartyLogo } from '@/views/votesList/PartyLogo'
import { initials } from '@/lib/initials'
import { pct } from '@/lib/format'
import { partyLabel } from '@/lib/parties'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

type Props = { member: MemberListItem; index?: number }

export function MemberCard({ member, index = 0 }: Props) {
  const t = useCopy()
  const locale = useLocale()
  return (
    <div className="relative flex flex-col border border-fg/15 bg-background transition-opacity hover:opacity-80">
      <a
        href={withLocale(`/members/${member.id}/votes/`, locale)}
        className="absolute inset-0 z-10"
        aria-label={`${member.name}, ${partyLabel(member.party, locale)}, ${member.state}, ${t.attendance} ${pct(member.attendance)}`}
      />
      {member.pictureUrl ? (
        <img
          src={member.pictureUrl}
          alt={member.name}
          loading={index < 12 ? 'eager' : 'lazy'}
          fetchPriority={index < 5 ? 'high' : undefined}
          decoding="async"
          className="aspect-square w-full object-cover"
        />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center bg-surface">
          <span className="text-xl font-semibold opacity-m">{initials(member.name)}</span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-s desk:p-m">
        <p className="min-h-[2lh] text-s font-semibold line-clamp-2 desk:text-m" style={{ overflowWrap: 'anywhere' }}>{member.name}</p>
        <p className="mt-xs flex min-w-0 items-center gap-xs text-s">
          <PartyLogo party={member.party} size={17} decorative />
          <span className="truncate opacity-l">{member.state}</span>
        </p>
        <span className="mt-m whitespace-nowrap text-s caption opacity-l">{t.attendance}</span>
        <div className="mt-xs flex items-center gap-s">
          <div className="h-[3px] min-w-0 flex-1 bg-fg/15">
            <div className="h-full bg-success" style={{ width: pct(member.attendance) }} />
          </div>
          <span className="text-s font-semibold tabular-nums">{pct(member.attendance)}</span>
        </div>
        <div className="mt-s flex items-baseline justify-between gap-s">
          <span className="min-w-0 truncate text-s caption opacity-l">{t.line}</span>
          <span className="text-s font-semibold tabular-nums">{member.loyalty === null ? '-' : pct(member.loyalty)}</span>
        </div>
      </div>
    </div>
  )
}
