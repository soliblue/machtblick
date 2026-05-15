import { Link } from '@/lib/Link'
import { initials } from '@/lib/initials'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { VoteSponsorMember } from '@/server/voteSponsors'

type Props = {
  member: VoteSponsorMember
  zIndex: number
  overlap: boolean
}

export function SponsorPortrait({ member, zIndex, overlap }: Props) {
  const label = member.partyAtDate
    ? `${member.displayName} · ${member.partyAtDate}`
    : member.displayName
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to="/members/$id/"
          params={{ id: member.memberId }}
          aria-label={label}
          className="block size-[32px] shrink-0 overflow-hidden rounded-full ring-[1.5px] ring-background"
          style={{ zIndex, marginLeft: overlap ? -12 : 0 }}
        >
          {member.portraitUrl ? (
            <img
              src={member.portraitUrl}
              alt={member.displayName}
              className="size-[32px] rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex size-[32px] items-center justify-center rounded-full bg-surface text-s font-semibold opacity-l">
              {initials(member.displayName)}
            </div>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
