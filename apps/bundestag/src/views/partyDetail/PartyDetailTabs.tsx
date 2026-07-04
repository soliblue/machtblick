import { Link } from '../../lib/Link'
import { useCopy, useLocale } from '@/lib/i18n'

type Props = { partyId: string; votes: number }

const TABS = [
  { to: '/parties/$id/profile/', label: 'Profil' },
  { to: '/parties/$id/votes/', label: 'Abstimmungen' },
  { to: '/parties/$id/history/', label: 'Verlauf' },
] as const

export function PartyDetailTabs({ partyId, votes }: Props) {
  const locale = useLocale()
  const t = useCopy()
  const tabs = TABS.map((tab) => ({
    ...tab,
    to: locale === 'en' ? (`/en${tab.to}` as typeof tab.to) : tab.to,
    label:
      tab.to === '/parties/$id/profile/' ? t.profile
      : tab.to === '/parties/$id/votes/' ? t.votes
      : t.history,
  }))
  return (
    <nav
      className="-mx-l mt-l mb-l grid grid-cols-3 border-y"
      style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
    >
      {tabs.map((t, i) => (
        <Link
          key={t.to}
          to={t.to}
          params={{ id: partyId }}
          className="-mb-px border-b-2 border-transparent py-m text-center text-l font-regular opacity-l transition-opacity hover:opacity-100"
          style={i > 0 ? { borderLeft: '1px solid color-mix(in oklab, var(--color-fg) 15%, transparent)' } : undefined}
          activeProps={{
            className: '-mb-px py-m text-center text-l font-semibold opacity-100 border-b-2 border-fg bg-surface',
          }}
        >
          {t.label}{t.to.includes('/votes/') && <span className="font-regular opacity-m tabular-nums"> {votes}</span>}
        </Link>
      ))}
    </nav>
  )
}
