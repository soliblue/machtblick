import { DefectorRow } from './DefectorRow'
import { PartyLogo } from '../votesList/PartyLogo'
import { PARTY_SLUG, partyLabel } from '@/lib/parties'
import type { MemberVoteRow } from '@/server/memberDetail'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

const HAIRLINE = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

const LINE_COLOR: Record<string, string> = {
  ja: 'var(--color-success)',
  nein: 'var(--color-danger)',
  enthalten: 'var(--color-yellow)',
}

type Defectors = Array<{
  party: string
  majority: string
  count: number
  members: Array<{ id: string; name: string; choice: string; pictureUrl: string | null }>
}>

type Props = { defectors: Defectors; partySummaries: Array<{ party: string; members: number }> }

export function DefectorList({ defectors, partySummaries }: Props) {
  const t = useCopy()
  const locale = useLocale()
  const membersByParty = new Map(partySummaries.map((s) => [s.party, s.members]))
  const lineLabel: Record<string, string> = { ja: t.yes, nein: t.no, enthalten: t.abstain }
  return defectors.length === 0 ? (
    <div className="text-m opacity-l">{t.noDefectors}</div>
  ) : (
    <div className="flex flex-col gap-l">
      {defectors.map((d) => (
        <div key={d.party}>
          <div className="flex items-center gap-s border-b pb-s" style={{ borderColor: HAIRLINE }}>
            <a href={withLocale(`/parties/${PARTY_SLUG[d.party] ?? d.party}/`, locale)} aria-label={partyLabel(d.party, locale)}>
              <PartyLogo party={d.party} size={20} decorative />
            </a>
            <span
              className="flex h-[20px] items-center px-s text-[11px] font-semibold uppercase leading-none"
              style={{
                letterSpacing: '0.14em',
                textIndent: '0.14em',
                background: LINE_COLOR[d.majority] ?? 'var(--color-fg)',
                color: d.majority === 'enthalten' ? 'black' : 'white',
              }}
            >
              {t.line} {lineLabel[d.majority] ?? d.majority}
            </span>
            <span className="text-s opacity-l">
              {d.count} {t.of} {membersByParty.get(d.party) ?? d.count}
            </span>
          </div>
          <div className="grid desk:grid-cols-2 desk:gap-x-l">
            {d.members.map((m) => (
              <DefectorRow key={m.id} id={m.id} name={m.name} choice={m.choice as MemberVoteRow['choice']} pictureUrl={m.pictureUrl} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
