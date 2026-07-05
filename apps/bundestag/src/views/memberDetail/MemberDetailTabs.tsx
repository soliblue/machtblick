import { Link } from '../../lib/Link'
import { useCopy, useLocale } from '@/lib/i18n'

type Props = {
  memberId: string
  votes: number
  speeches: number
  proposals: number
}

const TABS = [
  { to: '/members/$id/votes/', enTo: '/en/members/$id/votes/', label: 'Abstimmungen', count: 'votes' },
  { to: '/members/$id/speeches/', enTo: '/en/members/$id/speeches/', label: 'Reden', count: 'speeches' },
  { to: '/members/$id/motions/', enTo: '/en/members/$id/motions/', label: 'Anträge', count: 'proposals' },
] as const

export function MemberDetailTabs({ memberId, votes, speeches, proposals }: Props) {
  const locale = useLocale()
  const t = useCopy()
  const counts = { votes, speeches, proposals }
  const tabs = TABS
    .filter((tab) => locale === 'de' || tab.enTo)
    .filter((tab) => counts[tab.count] > 0)
    .map((tab) => ({
      ...tab,
      to: locale === 'en' && tab.enTo ? tab.enTo : tab.to,
      label:
        tab.to === '/members/$id/votes/' ? t.votes
        : tab.to === '/members/$id/speeches/' ? t.speeches
        : locale === 'en' ? 'Proposals' : 'Anträge',
    }))
  return tabs.length > 0 ? (
    <nav
      className="-mx-l mt-l mb-l grid border-y"
      style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)', gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab, i) => (
        <Link
          key={tab.to}
          to={tab.to}
          params={{ id: memberId }}
          className="-mb-px border-b-2 border-transparent py-m text-center text-m font-regular opacity-l transition-opacity hover:opacity-100"
          style={i > 0 ? { borderLeft: '1px solid color-mix(in oklab, var(--color-fg) 15%, transparent)' } : undefined}
          activeProps={{
            className: '-mb-px py-m text-center text-m font-semibold opacity-100 border-b-2 border-fg bg-surface',
          }}
        >
          <span className="block truncate">{tab.label}</span>
        </Link>
      ))}
    </nav>
  ) : null
}
