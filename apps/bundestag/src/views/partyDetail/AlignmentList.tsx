import type { PartyAlignment } from '@/server/parties'
import { PARTY_LABEL, PARTY_SLUG } from '@/lib/parties'
import { PartyLogo } from '@/views/votesList/PartyLogo'
import { Link } from '@/lib/Link'
import { pct } from '@/lib/format'

type Props = { alignments: PartyAlignment[]; party: string }

export function AlignmentList({ alignments }: Props) {
  return (
    <div className="flex flex-col">
      {alignments.map((a) => {
        const slug = PARTY_SLUG[a.party]
        const row = (
          <div className="grid grid-cols-[10rem_1fr_3rem] items-center gap-m py-s">
            <div className="flex items-center gap-s">
              <PartyLogo party={a.party} size={20} decorative />
              <span className="text-m font-semibold">{PARTY_LABEL[a.party] ?? a.party}</span>
            </div>
            <div className="relative h-2" style={{ background: 'color-mix(in oklab, var(--color-fg) 6%, transparent)' }}>
              <div className="h-full" style={{ width: `${a.agreement * 100}%`, background: 'var(--color-success)' }} />
            </div>
            <div className="text-right text-m tabular-nums">{pct(a.agreement)}</div>
          </div>
        )
        return slug ? (
          <Link
            key={a.party}
            to="/parties/$id/"
            params={{ id: slug }}
            className="block transition-opacity hover:opacity-80"
          >
            {row}
          </Link>
        ) : (
          <div key={a.party}>{row}</div>
        )
      })}
    </div>
  )
}
