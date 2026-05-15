import { Link } from '../../lib/Link'
import { useCopy, useLocale } from '@/lib/i18n'

type Props = { memberId: string }

const TABS = [
  { to: '/members/$id/abstimmungen/', label: 'Abstimmungen' },
  { to: '/members/$id/reden/', label: 'Reden' },
  { to: '/members/$id/anfragen/', label: 'Anfragen' },
] as const

export function MemberDetailTabs({ memberId }: Props) {
  const locale = useLocale()
  const t = useCopy()
  const tabs = TABS
    .filter((tab) => locale === 'de' || tab.to === '/members/$id/abstimmungen/')
    .map((tab) => ({
      ...tab,
      to: locale === 'en' ? (`/en${tab.to}` as typeof tab.to) : tab.to,
      label:
        tab.to === '/members/$id/abstimmungen/' ? t.votes
        : tab.to === '/members/$id/reden/' ? t.speeches
        : 'Anfragen',
    }))
  return (
    <nav
      className="-mx-l mt-l mb-l grid border-y"
      style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)', gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((t, i) => (
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
