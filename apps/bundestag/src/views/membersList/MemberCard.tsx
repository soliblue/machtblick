import type { MemberListItem } from '@/server/members'
import { PartyLogo } from '@/views/votesList/PartyLogo'
import { initials } from '@/lib/initials'
import { PARTY_COLOR, PARTY_LOGO, partyLabel } from '@/lib/parties'
import { useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'
import { memberPlaceholderBackground } from './memberPlaceholderBackground'

type Props = { member: MemberListItem; index?: number }

export function MemberCard({ member, index = 0 }: Props) {
  const locale = useLocale()
  const color = PARTY_COLOR[member.party] ?? 'var(--color-fg)'
  return (
    <div className="group relative aspect-[3/4] overflow-hidden rounded-m bg-surface transition-opacity hover:opacity-85">
      <a
        href={withLocale(`/members/${member.id}/votes/`, locale)}
        className="absolute inset-0 z-20"
        aria-label={`${member.name}, ${partyLabel(member.party, locale)}, ${member.state}`}
      />
      {member.pictureUrl ? (
        <img
          src={member.pictureUrl}
          alt={member.name}
          loading={index < 12 ? 'eager' : 'lazy'}
          fetchPriority={index < 5 ? 'high' : undefined}
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div
          className={`member-placeholder flex h-full w-full items-center justify-center text-fg ${memberPlaceholderBackground(member.id)}`}
        >
          <span className="text-xl font-semibold">{initials(member.name)}</span>
        </div>
      )}
      <div className="absolute right-0 top-0 z-10 p-s">
        {PARTY_LOGO[member.party] ? (
          <PartyLogo party={member.party} size={17} decorative />
        ) : (
          <span className="h-[14px] w-[14px] rounded-full" style={{ background: color }} />
        )}
      </div>
      {member.pictureUrl ? <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" /> : null}
      <div className={`absolute inset-x-0 bottom-0 z-10 p-s ${member.pictureUrl ? 'text-white' : 'text-fg'}`}>
        <div className="text-s font-semibold leading-tight line-clamp-2 desk:text-m" style={{ overflowWrap: 'anywhere' }}>
          {member.name}
        </div>
      </div>
    </div>
  )
}
