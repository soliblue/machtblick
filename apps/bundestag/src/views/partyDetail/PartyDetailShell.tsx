import type { ReactNode } from 'react'
import { Users } from 'lucide-react'
import type { PartyDetail as PartyDetailData } from '@/server/partyDetail'
import { PARTY_COLOR, PARTY_LOGO, partyLabel } from '@/lib/parties'
import { PartyLogo } from '@/views/votesList/PartyLogo'
import { PartyDetailTabs } from './PartyDetailTabs'
import { useLocale, useCopy } from '@/lib/i18n'

type Props = {
  data: PartyDetailData
  children: ReactNode
}

export function PartyDetailShell({ data, children }: Props) {
  const color = PARTY_COLOR[data.party] ?? 'var(--color-gray)'
  const locale = useLocale()
  const label = partyLabel(data.party, locale)
  const t = useCopy()
  return (
    <main className="mx-auto max-w-3xl p-l">
      <h1 className="flex items-center gap-m text-xxl font-semibold">
        {PARTY_LOGO[data.party] ? (
          <PartyLogo party={data.party} size={44} decorative />
        ) : (
          <span className="inline-block size-6" style={{ background: color }} />
        )}
        {label}
        <a
          href={`${locale === 'en' ? '/en' : ''}/members/?party=${encodeURIComponent(data.party)}`}
          className="ml-auto flex items-center gap-xs text-l font-regular opacity-l hover:opacity-100"
          aria-label={`${data.seats} ${t.seats}`}
        >
          <Users size={19} />
          <span>{data.seats}</span>
          <span className="sr-only">{t.navMembers}</span>
        </a>
      </h1>
      <PartyDetailTabs partyId={data.slug} />
      {children}
    </main>
  )
}
