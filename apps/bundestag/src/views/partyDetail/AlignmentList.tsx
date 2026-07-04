import type { PartyAlignment } from '@/server/partyDetail'
import { PARTY_SLUG, partyLabel } from '@/lib/parties'
import { PartyLogo } from '@/views/votesList/PartyLogo'
import { pct } from '@/lib/format'
import { useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

type Props = { alignments: PartyAlignment[]; party: string }

export function AlignmentList({ alignments }: Props) {
  const locale = useLocale()
  return (
    <div className="flex flex-col">
      {alignments.map((a) => {
        const slug = PARTY_SLUG[a.party]
        const row = (
          <div className="grid grid-cols-[10rem_1fr_3rem] items-center gap-m py-s">
            <div className="flex items-center gap-s">
              <PartyLogo party={a.party} size={20} decorative />
              <span className="text-m font-semibold">{partyLabel(a.party, locale)}</span>
            </div>
            <div className="relative h-2" style={{ background: 'color-mix(in oklab, var(--color-fg) 6%, transparent)' }}>
              <div className="h-full" style={{ width: `${a.agreement * 100}%`, background: 'var(--color-success)' }} />
            </div>
            <div className="text-right text-m tabular-nums">{pct(a.agreement)}</div>
          </div>
        )
        return slug ? (
          <a
            key={a.party}
            href={withLocale(`/parties/${slug}/profile/`, locale)}
            className="block transition-opacity hover:opacity-80"
          >
            {row}
          </a>
        ) : (
          <div key={a.party}>{row}</div>
        )
      })}
    </div>
  )
}
