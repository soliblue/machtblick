import type { VoteSponsorMember } from '@/server/voteSponsors'
import { SponsorPortrait } from './SponsorPortrait'

type Props = {
  signatories: VoteSponsorMember[]
  cap?: number
}

export function SponsorPile({ signatories, cap = 8 }: Props) {
  const visible = signatories.slice(0, cap)
  const overflow = signatories.slice(cap)
  return (
    <div className="flex h-[32px] items-center">
      {visible.map((m, i) => (
        <SponsorPortrait
          key={m.memberId}
          member={m}
          zIndex={visible.length - i}
          overlap={i > 0}
        />
      ))}
      {overflow.length > 0 && (
        <div
          title={overflow.map((m) => m.displayName).join(', ')}
          className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-surface text-s font-semibold opacity-l ring-[1.5px] ring-background"
          style={{ marginLeft: -12, zIndex: 0 }}
        >
          +{overflow.length}
        </div>
      )}
    </div>
  )
}
