import { Link } from '../../lib/Link'

type Props = { memberId: string }

const TABS = [
  { to: '/members/$id/abstimmungen/', label: 'Abstimmungen' },
  { to: '/members/$id/reden/', label: 'Reden' },
  { to: '/members/$id/anfragen/', label: 'Anfragen' },
] as const

export function MemberDetailTabs({ memberId }: Props) {
  return (
    <nav
      className="mt-l mb-l grid grid-cols-3 border-y"
      style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
    >
      {TABS.map((t, i) => (
        <Link
          key={t.to}
          to={t.to}
          params={{ id: memberId }}
          className="-mb-px border-b-2 border-transparent py-m text-center text-l font-regular opacity-l transition-opacity hover:opacity-100"
          style={i > 0 ? { borderLeft: '1px solid color-mix(in oklab, var(--color-fg) 15%, transparent)' } : undefined}
          activeProps={{
            className: '-mb-px py-m text-center text-l font-semibold opacity-100 border-b-2 border-fg bg-surface',
          }}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  )
}
