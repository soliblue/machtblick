import type { MpVoteDetail as MpVoteDetailData } from '@/server/mpVoteDetail'
import type { ParliamentSlug } from '@/lib/parliaments'
import { formatDateLong } from '@/lib/format'
import { SERIF } from '@/lib/fonts'
import { Stamp } from '@/views/votesList/Stamp'
import { VoteHemicycle } from '@/views/votesList/VoteHemicycle'
import { VoteDistributionDonut } from '@/views/votesList/VoteDistributionDonut'
import { MpSectionNav } from './MpSectionNav'
import { MpChoicePill } from './MpChoicePill'

type Props = { section: ParliamentSlug; data: MpVoteDetailData }

const jaShare = (s: MpVoteDetailData['partySummaries'][number]) => {
  const decided = s.yes + s.no + s.abstain
  return decided ? s.yes / decided : 0
}

export function MpVoteDetail({ section, data }: Props) {
  const { vote } = data
  const title = vote.titleDe ?? vote.title
  const groups = [...data.partySummaries].sort((a, b) => jaShare(b) - jaShare(a))
  return (
    <>
      <MpSectionNav section={section} active="votes" />
      <main className="mx-auto max-w-3xl px-l py-l">
        <div className="flex items-center justify-between gap-m">
          <span className="text-s caption opacity-l">{formatDateLong(vote.date)}{vote.reference ? ` · ${vote.reference}` : ''}</span>
          <Stamp variant={vote.result} rotated={false} />
        </div>
        <h2 className="mt-m font-display text-xxl font-semibold leading-[1.1]" style={{ textWrap: 'pretty' }}>{title}</h2>
        {vote.titleIsEnglish && <p className="mt-xs text-s caption opacity-l">Titel auf Englisch</p>}
        {vote.description && <p className="mt-m text-m leading-[1.5]" style={{ fontFamily: SERIF }}>{vote.description}</p>}

        <div className="mt-xl flex justify-center">
          <VoteHemicycle yes={vote.yes} no={vote.no} abstain={vote.abstain} absent={vote.absent} totalMembers={vote.totalMembers} hero />
        </div>

        <h3 className="mt-xl text-s caption opacity-l">So stimmten die Fraktionen</h3>
        <div className="mt-m grid grid-cols-3 gap-l sm:grid-cols-4 md:grid-cols-5">
          {groups.map((g) => (
            <div key={g.party} className="flex flex-col items-center gap-xs">
              <VoteDistributionDonut yes={g.yes} no={g.no} abstain={g.abstain} absent={g.absent} size={64} showLabel />
              <span className={`max-w-full truncate text-s uppercase ${g.position === 'mixed' ? 'font-semibold' : 'opacity-l'}`} style={{ letterSpacing: '0.06em' }}>{g.label}</span>
            </div>
          ))}
        </div>

        {data.defectors.length > 0 && (
          <>
            <h3 className="mt-xl text-s caption opacity-l">Abweichler</h3>
            <div className="mt-m flex flex-col gap-l">
              {data.defectors.map((d) => (
                <div key={d.party}>
                  <p className="text-s caption opacity-l">{d.label} · {d.count}</p>
                  <ul className="mt-s flex flex-col gap-xs">
                    {d.members.map((m) => (
                      <li key={m.id} className="flex items-center justify-between gap-m border-b border-fg/15 pb-xs">
                        <a href={`/${section}/members/${m.id}/`} className="min-w-0 truncate text-m hover:underline">{m.name}</a>
                        <MpChoicePill choice={m.choice as 'ja' | 'nein' | 'enthalten' | 'nicht_abgegeben'} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}

        <a href={vote.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-xl inline-block text-s caption opacity-l hover:opacity-100">Quelle ansehen</a>
      </main>
    </>
  )
}
