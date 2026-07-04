import { ExternalLink } from 'lucide-react'
import { useMemo } from 'react'
import type { AntragDetail as AntragDetailData } from '@/server/antraege'
import type { MemberVoteRow } from '@/server/members'
import { formatDate } from '@/lib/format'
import { isLaenderInitiative } from '@/lib/bundeslaender'
import { Markdown } from '@/lib/Markdown'
import { MarkdownInline } from '@/lib/MarkdownInline'
import { PartyBadge } from '@/views/votesList/PartyBadge'
import { Stamp, type StampVariant } from '@/views/votesList/Stamp'
import { DebateList } from '@/views/voteDetail/DebateList'
import { useCopy, useLocale } from '@/lib/i18n'
import { AntragSignatoryStrip } from './AntragSignatoryStrip'
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

function statusText(status: string | null, stamp: StampVariant | null) {
  return status && !stamp ? status : null
}

export function AntragDetail({ data }: Props) {
  const { antrag, signatories, linkedVotes, debate } = data
  const locale = useLocale()
  const t = useCopy()
  const stamp = statusStamp(antrag.beratungsstand, linkedVotes.length > 0)
  const plainStatus = statusText(antrag.beratungsstand, stamp)
  const summary = antrag.summarySimplified ?? antrag.abstract
  const title = antrag.cleanTitle ?? antrag.title
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
      <h1 className="text-xxl font-semibold">{title}</h1>
      {antrag.cleanTitle && antrag.cleanTitle !== antrag.title ? (
        <div className="mt-s text-s opacity-l">{t.officialTitle}: {antrag.title}</div>
      ) : null}
      {isLaenderInitiative(antrag.initiativeFraktion) && (
        <div className="mt-s text-s caption opacity-l">{t.laenderMotion}</div>
      )}
      <div className="mt-s flex flex-wrap items-center gap-m text-m">
        <PartyBadge party={antrag.initiativeFraktion} />
        {antrag.introducedDate ? <span className="opacity-l">{formatDate(antrag.introducedDate)}</span> : null}
        {antrag.drucksache ? <span className="opacity-l">Drs. {antrag.drucksache}</span> : null}
        {plainStatus ? <span className="opacity-l">{plainStatus}</span> : null}
      </div>
      <div className="mt-m mb-l flex flex-wrap items-center gap-l">
        {stamp ? <Stamp variant={stamp} size="m" /> : null}
      </div>

      <AntragSignatoryStrip signatories={signatories} />

      {summary ? (
        <div className="mb-l">
          <div className="mb-s text-s caption opacity-l">{t.proposalSummary}</div>
          {antrag.summarySimplified
            ? <p className="text-m"><MarkdownInline>{antrag.summarySimplified}</MarkdownInline></p>
            : <p className="text-m whitespace-pre-line">{summary}</p>}
        </div>
      ) : null}

      {antrag.summaryDetail ? (
        <section className="mb-l">
          <div className="mb-m bg-surface p-m text-s">
            {t.aiSummaryNotice}
            {antrag.drucksachePdfUrl ? (
              <> {t.fullMotion} <a href={antrag.drucksachePdfUrl} target="_blank" rel="noreferrer" className="underline">{t.here}</a>.</>
            ) : null}
          </div>
          <Markdown>{antrag.summaryDetail}</Markdown>
        </section>
      ) : antrag.drucksachePdfUrl ? (
        <div className="mb-l">
          <a href={antrag.drucksachePdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-xs text-m underline-offset-4 hover:underline">
            <span>{locale === 'en' ? 'Full document' : 'Vollständige Drucksache'}</span>
            <ExternalLink size={17} />
          </a>
        </div>
      ) : null}

      {linkedVotes.length > 0 ? (
        <section className="mb-l">
          <div className="mb-s text-s caption opacity-l">{locale === 'en' ? 'Votes' : 'Abstimmungen'}</div>
          <div className="flex flex-col">
            {linkedVotes.map((vote) => <AntragVoteResult key={vote.id} vote={vote} />)}
          </div>
        </section>
      ) : null}

      {debate.length > 0 ? (
        <DebateList speeches={debate} source={data.debateSource} ballotByMember={ballotByMember} partySummaries={partySummaries} />
      ) : null}
    </main>
  )
}
