import type { MpMemberListItem } from '@/server/mpMembers'
import type { ParliamentSlug } from '@/lib/parliaments'
import { initials } from '@/lib/initials'
import { pct } from '@/lib/format'

type Props = { member: MpMemberListItem; section: ParliamentSlug; index?: number }

export function MpMemberCard({ member, section, index = 0 }: Props) {
  const sub = member.nationalParty ?? member.state ?? member.label
  return (
    <div className="relative flex flex-col border border-fg/15 bg-background transition-opacity hover:opacity-80">
      <a
        href={`/${section}/members/${member.id}/`}
        className="absolute inset-0 z-10"
        aria-label={`${member.name}, ${member.label}, Anwesenheit ${pct(member.attendance)}`}
      />
      {member.pictureUrl ? (
        <img
          src={member.pictureUrl}
          alt={member.name}
          loading={index < 12 ? 'eager' : 'lazy'}
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
        <p className="mt-xs min-w-0 truncate text-s opacity-l">{member.label}{sub && sub !== member.label ? ` · ${sub}` : ''}</p>
        <span className="mt-m whitespace-nowrap text-s caption opacity-l">Anwesenheit</span>
        <div className="mt-xs flex items-center gap-s">
          <div className="h-[3px] min-w-0 flex-1 bg-fg/15">
            <div className="h-full bg-success" style={{ width: pct(member.attendance) }} />
          </div>
          <span className="text-s font-semibold tabular-nums">{pct(member.attendance)}</span>
        </div>
        <div className="mt-s flex items-baseline justify-between gap-s">
          <span className="min-w-0 truncate text-s caption opacity-l">Fraktionslinie</span>
          <span className="text-s font-semibold tabular-nums">{member.loyalty === null ? '-' : pct(member.loyalty)}</span>
        </div>
      </div>
    </div>
  )
}
