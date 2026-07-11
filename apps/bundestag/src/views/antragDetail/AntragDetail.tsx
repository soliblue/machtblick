import { Calendar, Landmark } from 'lucide-react'
import { useMemo } from 'react'
import type { AntragDetail as AntragDetailData } from '@/server/antraege'
import type { MemberVoteRow } from '@/server/memberDetail'
import { formatDate } from '@/lib/format'
import { SERIF } from '@/lib/fonts'
import { isLaenderInitiative } from '@/lib/bundeslaender'
import { PARTY_LOGO, partyLabel } from '@/lib/parties'
import { Markdown } from '@/lib/Markdown'
import { MarkdownInline } from '@/lib/MarkdownInline'
import { PartyBadge } from '@/views/votesList/PartyBadge'
import { Stamp, type StampVariant } from '@/views/votesList/Stamp'
import { DebateList } from '@/views/voteDetail/DebateList'
import { useCopy, useLocale } from '@/lib/i18n'
import { AntragSignatoryStrip } from './AntragSignatoryStrip'
import { AntragSource } from './AntragSource'
import { AntragSubjectChips } from './AntragSubjectChips'
import { AntragTimeline } from './AntragTimeline'
import { AntragVoteResult } from './AntragVoteResult'

type Props = {
  data: AntragDetailData
}

function statusStamp(status: string | null, hasVote: boolean): StampVariant | null {
  return status === 'Abgelehnt' && !hasVote ? 'abgelehnt'
    : status === 'Angenommen' && !hasVote ? 'angenommen'
    : status === 'Überwiesen' ? 'ueberwiesen'
    : status === 'Beschlussempfehlung liegt vor' ? 'beschlussempfehlung'
    : status?.includes('Noch nicht beraten') ? 'nicht-beraten'
    : null
}

export function AntragDetail({ data }: Props) {
  const { antrag, signatories, linkedVotes, debate } = data
  const locale = useLocale()
  const t = useCopy()
  const stamp = statusStamp(antrag.beratungsstand, linkedVotes.length > 0)
  const summary = antrag.summarySimplified ?? antrag.abstract
  const title = antrag.cleanTitle ?? antrag.title
  const laender = isLaenderInitiative(antrag.initiativeFraktion)
  const showLogo = !laender && !!antrag.initiativeFraktion && antrag.initiativeFraktion.split(',').some((p) => PARTY_LOGO[p.trim()])
  const ballotByMember = useMemo(() => {
    const out = new Map<string, { choice: MemberVoteRow['choice']; pictureUrl: string | null }>()
    for (const vote of linkedVotes) {
      for (const ballot of vote.memberBallots) {
        if (!out.has(ballot.memberId)) out.set(ballot.memberId, { choice: ballot.choice as MemberVoteRow['choice'], pictureUrl: ballot.pictureUrl })
      }
    }
    return out
  }, [linkedVotes])
  const partySummaries = linkedVotes.find((vote) => vote.partySummaries.length > 0)?.partySummaries ?? []
  return (
    <main className="mx-auto max-w-3xl p-l">
      <div className="flex items-start justify-between gap-l">
        <div className="min-w-0">
          {laender ? (
            <Landmark size={26} aria-hidden="true" />
          ) : showLogo ? (
            <PartyBadge party={antrag.initiativeFraktion} compact logoSize={32} />
          ) : antrag.initiativeFraktion ? (
            <div className="text-s caption opacity-l">{partyLabel(antrag.initiativeFraktion, locale)}</div>
          ) : null}
          <h1 className="mt-m font-display text-xxl font-semibold" style={{ textWrap: 'pretty' }}>{title}</h1>
        </div>
        {antrag.introducedDate && (
          <div className="hidden shrink-0 items-center gap-s text-l opacity-l desk:flex">
            <Calendar size={19} aria-hidden="true" />
            <span>{formatDate(antrag.introducedDate)}</span>
          </div>
        )}
      </div>
      {antrag.cleanTitle && antrag.cleanTitle !== antrag.title ? (
        <div className="mt-s text-s opacity-l">{t.officialTitle}: {antrag.title}</div>
      ) : null}
      <div className="mt-m flex flex-wrap items-center gap-m text-m">
        <span className="inline-flex h-[20px] items-center rounded-m border border-fg/40 px-s text-[11px] font-semibold uppercase leading-none" style={{ letterSpacing: '0.14em' }}>
          {antrag.type === 'gesetzentwurf' ? t.bill : t.motion}
        </span>
        {antrag.introducedDate ? <span className="opacity-l desk:hidden">{formatDate(antrag.introducedDate)}</span> : null}
        {antrag.drucksache ? <span className="opacity-l">Drs. {antrag.drucksache}</span> : null}
      </div>
      {laender && (
        <>
          <div className="mt-m text-s caption opacity-l">{t.laenderMotion}</div>
          <div className="mt-s"><PartyBadge party={antrag.initiativeFraktion} /></div>
        </>
      )}
      <section className="mt-xl">
        <div className="mb-m text-s caption opacity-l">{t.procedure}</div>
        <div className="flex flex-col gap-l desk:flex-row desk:items-center">
          <div className="min-w-0 flex-1">
            <AntragTimeline
              type={antrag.type}
              beratungsstand={antrag.beratungsstand}
              introducedDate={antrag.introducedDate}
              vote={linkedVotes.length > 0 ? { result: linkedVotes[0].result, date: linkedVotes[0].date } : null}
            />
          </div>
          {stamp ? <div className="shrink-0"><Stamp variant={stamp} size="m" /></div> : null}
        </div>
      </section>

      <AntragSubjectChips subjects={antrag.sachgebiet} />

      {summary ? (
        <section className="mt-xl">
          <div className="mb-s text-s caption opacity-l">{t.proposalSummary}</div>
          {antrag.summarySimplified
            ? <p className="text-m leading-[1.45]" style={{ fontFamily: SERIF }}><MarkdownInline>{antrag.summarySimplified}</MarkdownInline></p>
            : <p className="whitespace-pre-line text-m leading-[1.45]" style={{ fontFamily: SERIF }}>{summary}</p>}
          {antrag.summarySimplified && (
            <p className="mt-s text-s opacity-l">
              {t.aiSummaryNotice}
            </p>
          )}
        </section>
      ) : null}

      {antrag.summaryDetail ? (
        <section className={summary ? 'mt-l' : 'mt-xl'}>
          <Markdown serif>{antrag.summaryDetail}</Markdown>
        </section>
      ) : null}

      {signatories.length > 0 ? (
        <div className="mt-xl">
          <AntragSignatoryStrip signatories={signatories} />
        </div>
      ) : null}

      {linkedVotes.length > 0 ? (
        <section className="mt-xl">
          <div className="mb-m text-s caption opacity-l">{t.votes}</div>
          <div className="flex flex-col pt-s">
            {linkedVotes.map((vote) => <AntragVoteResult key={vote.id} vote={vote} />)}
          </div>
        </section>
      ) : null}

      {debate.length > 0 ? (
        <section className="mt-xl">
          <div className="mb-m text-s caption opacity-l">{locale === 'en' ? 'Debate' : 'Debatte'}</div>
          <DebateList speeches={debate} source={data.debateSource} ballotByMember={ballotByMember} partySummaries={partySummaries} />
        </section>
      ) : null}

      <AntragSource pdfUrl={antrag.drucksachePdfUrl} />
    </main>
  )
}
