import { cn } from '@/lib/utils'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'
import { hasPartyLine, PARTY_COLOR, PARTY_LOGO, PARTY_SLUG, partyLabel } from '@/lib/parties'
import { PartyLogo } from './PartyLogo'

type Props = { party: string | null; compact?: boolean; logoSize?: number }

export function PartyBadge({ party, compact = false, logoSize = 20 }: Props) {
  const locale = useLocale()
  const t = useCopy()
  if (!party) return <span className="text-s opacity-l">{t.other}</span>
  if (!hasPartyLine(party)) return <span>{partyLabel(party, locale)}</span>
  const parties = party.split(',').map((part) => part.trim()).filter(Boolean)
  if (parties.length > 1) {
    return (
      <span className="inline-flex flex-wrap items-center gap-xs">
        {parties.map((part) => <PartyBadge key={part} party={part} compact={compact} logoSize={logoSize} />)}
      </span>
    )
  }
  const color = PARTY_COLOR[party] ?? 'var(--color-gray)'
  const slug = party === 'Bundesregierung' ? undefined : PARTY_SLUG[party]
  if (compact && PARTY_LOGO[party]) {
    const logo = <PartyLogo party={party} size={logoSize} decorative />
    return slug ? (
      <a
        href={withLocale(`/parties/${slug}/`, locale)}
        onClick={(e) => e.stopPropagation()}
        aria-label={partyLabel(party, locale)}
        className="relative z-10 -m-xs inline-flex p-xs hover:opacity-80"
      >
        {logo}
      </a>
    ) : logo
  }
  const badge = (
    <span
      data-slot="badge"
      data-variant="default"
      className={cn(
        'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3',
        'bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        'border-transparent',
      )}
      style={{
        background: `color-mix(in oklab, ${color} 18%, transparent)`,
        color,
      }}
    >
      {partyLabel(party, locale)}
    </span>
  )
  return slug ? (
    <a
      href={withLocale(`/parties/${slug}/`, locale)}
      onClick={(e) => e.stopPropagation()}
      className="relative z-10 -m-xs inline-flex p-xs hover:opacity-80"
    >
      {badge}
    </a>
  ) : (
    badge
  )
}
