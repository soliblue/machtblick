import { Badge } from '@/components/ui/badge'
import { Link } from '../../lib/Link'
import { PARTY_COLOR, PARTY_LABEL, PARTY_LOGO, PARTY_SLUG } from '@/lib/parties'
import { PartyLogo } from './PartyLogo'

type Props = { party: string | null; compact?: boolean }

export function PartyBadge({ party, compact = false }: Props) {
  if (!party) return <span className="text-s opacity-l">Sonstige</span>
  const color = PARTY_COLOR[party] ?? 'var(--color-gray)'
  const slug = party === 'Bundesregierung' ? undefined : PARTY_SLUG[party]
  if (compact && PARTY_LOGO[party]) {
    const logo = <PartyLogo party={party} size={20} />
    return slug ? (
      <Link
        to="/parties/$id/"
        params={{ id: slug }}
        onClick={(e) => e.stopPropagation()}
        aria-label={PARTY_LABEL[party] ?? party}
        className="relative z-10 inline-flex hover:opacity-80"
      >
        {logo}
      </Link>
    ) : logo
  }
  const badge = (
    <Badge
      className="border-transparent"
      style={{
        background: `color-mix(in oklab, ${color} 18%, transparent)`,
        color,
      }}
    >
      {PARTY_LABEL[party] ?? party}
    </Badge>
  )
  return (
    <span className="inline-flex items-center gap-s">
      {PARTY_LOGO[party] && (
        <>
          <PartyLogo party={party} size={16} />
          <span>·</span>
        </>
      )}
      {slug ? (
        <Link
          to="/parties/$id/"
          params={{ id: slug }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 hover:opacity-80"
        >
          {badge}
        </Link>
      ) : (
        badge
      )}
    </span>
  )
}
