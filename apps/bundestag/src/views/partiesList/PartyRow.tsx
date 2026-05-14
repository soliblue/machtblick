import { Link } from '../../lib/Link'
import type { PartyListItem } from '@/server/parties'
import { PARTY_COLOR, PARTY_LABEL, PARTY_LOGO } from '@/lib/parties'
import { PartyLogo } from '../votesList/PartyLogo'

type Props = { party: PartyListItem }

export function PartyRow({ party }: Props) {
  const color = PARTY_COLOR[party.party] ?? 'var(--color-gray)'
  return (
    <Link
      to="/parties/$id/"
      params={{ id: party.slug }}
      className="flex items-center justify-between border-t py-l transition-opacity first:border-t-0 hover:opacity-80"
      style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
    >
      <div className="flex items-center gap-m">
        {PARTY_LOGO[party.party] ? (
          <PartyLogo party={party.party} size={24} decorative />
        ) : (
          <span className="inline-block size-4" style={{ background: color }} />
        )}
        <span className="text-l font-semibold">{PARTY_LABEL[party.party] ?? party.party}</span>
      </div>
      <div className="flex items-center gap-l text-m">
        <span>{party.seats} Sitze</span>
      </div>
    </Link>
  )
}
