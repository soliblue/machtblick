import type { PartyListItem } from '@/server/parties'
import { Badge } from '@/components/ui/badge'
import { hasPartyLine, isGoverning, PARTY_COLOR, PARTY_LOGO, partyLabel } from '@/lib/parties'
import { PartyLogo } from '../votesList/PartyLogo'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

type Props = { party: PartyListItem }

export function PartyRow({ party }: Props) {
  const color = PARTY_COLOR[party.party] ?? 'var(--color-gray)'
  const locale = useLocale()
  const t = useCopy()
  const governing = isGoverning(party.party)
  return (
    <a
      href={withLocale(`/parties/${party.slug}/profile/`, locale)}
      className="flex items-center justify-between border-t py-l transition-opacity first:border-t-0 hover:opacity-80"
      style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
    >
      <div className="flex items-center gap-m">
        {PARTY_LOGO[party.party] ? (
          <PartyLogo party={party.party} size={24} decorative />
        ) : (
          <span className="inline-block size-4" style={{ background: color }} />
        )}
        <span className="text-l font-semibold">{partyLabel(party.party, locale)}</span>
      </div>
      <div className="flex items-center gap-l text-m">
        <span>{party.seats} {t.seats}</span>
        {hasPartyLine(party.party) && (
          <Badge
            className="border-transparent font-semibold"
            style={governing
              ? { background: 'color-mix(in oklab, var(--color-success) 18%, transparent)', color: 'var(--color-success)' }
              : { background: 'var(--color-elevated)', color: 'var(--color-fg)', opacity: 0.7 }}
          >
            {governing ? t.government : t.opposition}
          </Badge>
        )}
      </div>
    </a>
  )
}
