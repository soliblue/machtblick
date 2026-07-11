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
      className="mb-l grid gap-xs rounded-m border border-fg/15 bg-surface p-xs"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          params={{ id: memberId }}
          className="min-w-0 rounded-m px-s py-s text-center text-s font-regular opacity-l transition-[background,opacity] hover:opacity-100"
          activeProps={{
            className: 'min-w-0 rounded-m bg-background px-s py-s text-center text-s font-semibold opacity-100 shadow-[0_1px_2px_rgba(10,10,10,0.08)]',
          }}
        >
          <span className="block truncate">{tab.label}</span>
        </Link>
      ))}
    </nav>
  ) : null
}
