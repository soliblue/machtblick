import { Link as TanStackLink } from '@tanstack/react-router'
import { useCopy, useLocale } from '@/lib/i18n'

const Link = ((props: Parameters<typeof TanStackLink>[0]) => (
  <TanStackLink reloadDocument {...props} />
)) as typeof TanStackLink

type Props = {
  memberId: string
  votes: number
  speeches: number
}

const TABS = [
  { to: '/members/$id/votes/', enTo: '/en/members/$id/votes/', count: 'votes' },
  { to: '/members/$id/speeches/', enTo: '/en/members/$id/speeches/', count: 'speeches' },
] as const

export function MemberDetailTabs({ memberId, votes, speeches }: Props) {
  const locale = useLocale()
  const t = useCopy()
  const counts = { votes, speeches }
  const tabs = TABS
    .filter((tab) => counts[tab.count] > 0)
    .map((tab) => ({
      to: locale === 'en' ? tab.enTo : tab.to,
      label: tab.count === 'votes' ? t.votes : t.speeches,
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
          className="min-w-0 px-s py-s text-center text-s font-regular opacity-l transition-[background,opacity] hover:opacity-100"
          style={{ borderRadius: 'calc(var(--radius-m) - var(--spacing-xs))' }}
          activeProps={{
            className: 'min-w-0 bg-background px-s py-s text-center text-s font-semibold opacity-100 shadow-[0_1px_2px_rgba(10,10,10,0.08)]',
          }}
        >
          <span className="block truncate">{tab.label}</span>
        </Link>
      ))}
    </nav>
  ) : null
}
