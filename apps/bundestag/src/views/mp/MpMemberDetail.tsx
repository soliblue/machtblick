import type { MpMemberDetail as MpMemberDetailData } from '@/server/mpMemberDetail'
import type { ParliamentSlug } from '@/lib/parliaments'
import { formatDateShort, pct } from '@/lib/format'
import { initials } from '@/lib/initials'
import { MpSectionNav } from './MpSectionNav'
import { MpChoicePill } from './MpChoicePill'

type Props = { section: ParliamentSlug; data: MpMemberDetailData }

export function MpMemberDetail({ section, data }: Props) {
  const { member } = data
  const sub = [member.label, member.nationalParty, member.state, member.country].filter(Boolean).join(' · ')
  return (
    <>
      <MpSectionNav section={section} active="members" />
      <main className="mx-auto max-w-3xl px-l py-l">
        <div className="flex items-center gap-l">
          {member.pictureUrl ? (
            <img src={member.pictureUrl} alt={member.name} className="h-[96px] w-[96px] object-cover" />
          ) : (
            <div className="flex h-[96px] w-[96px] items-center justify-center bg-surface">
              <span className="text-xl font-semibold opacity-m">{initials(member.name)}</span>
            </div>
          )}
          <div className="min-w-0">
            <h2 className="font-display text-xl font-semibold leading-[1.1]">{member.name}</h2>
            <p className="mt-xs text-s opacity-l">{sub}</p>
            <p className="mt-m text-s caption opacity-l">Anwesenheit <span className="font-semibold tabular-nums">{pct(data.attendance)}</span> · {data.votesAppeared} Abstimmungen</p>
          </div>
        </div>

        <h3 className="mt-xl text-s caption opacity-l">Abstimmungsverhalten</h3>
        <ul className="mt-m flex flex-col">
          {data.ballots.map((b) => (
            <li key={b.voteId} className="flex items-center justify-between gap-m border-b border-fg/15 py-s">
              <a href={`/${section}/votes/${b.voteId}/`} className="min-w-0 flex-1">
                <span className="line-clamp-2 text-m hover:underline">{b.titleDe ?? b.title}</span>
                <span className="mt-xs block text-s caption opacity-l">{formatDateShort(b.date)} · {b.result === 'angenommen' ? 'Angenommen' : 'Abgelehnt'}</span>
              </a>
              <MpChoicePill choice={b.choice} />
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}
