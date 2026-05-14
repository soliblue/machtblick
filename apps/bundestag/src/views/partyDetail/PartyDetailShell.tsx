import type { ReactNode } from 'react'
import { Users } from 'lucide-react'
import { Link } from '../../lib/Link'
import type { PartyDetail as PartyDetailData } from '@/server/parties'
import { PARTY_COLOR, PARTY_LABEL, PARTY_LOGO } from '@/lib/parties'
import { PartyLogo } from '@/views/votesList/PartyLogo'
import { PartyDetailTabs } from './PartyDetailTabs'

type Props = {
  data: PartyDetailData
  children: ReactNode
}

export function PartyDetailShell({ data, children }: Props) {
  const color = PARTY_COLOR[data.party] ?? 'var(--color-gray)'
  const label = PARTY_LABEL[data.party] ?? data.party
  return (
    <main className="mx-auto max-w-3xl p-l">
      <h1 className="flex items-center gap-m text-xxl font-semibold">
        {PARTY_LOGO[data.party] ? (
          <PartyLogo party={data.party} size={44} decorative />
        ) : (
          <span className="inline-block size-6" style={{ background: color }} />
        )}
        {label}
        <Link
          to="/members/"
          search={{ party: data.party }}
          className="ml-auto flex items-center gap-xs text-l font-regular opacity-l hover:opacity-100"
          aria-label={`${data.seats} Sitze`}
        >
          <Users size={19} />
          <span>{data.seats}</span>
        </Link>
      </h1>
      <PartyDetailTabs partyId={data.slug} />
      {children}
    </main>
  )
}
