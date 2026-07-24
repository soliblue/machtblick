import type { AntragDetail, AntragLinkedVote } from '@/server/antraege'
import { Markdown } from '@/components/Markdown'
import { useCopy } from '@/lib/i18n'
import { AntragSource } from './AntragSource'
import { AntragSubjectChips } from './AntragSubjectChips'
import { AntragTimeline } from './AntragTimeline'

type Props = {
  antrag: AntragDetail['antrag']
  linkedVotes: AntragLinkedVote[]
}

export function AntragDetailsTab({ antrag, linkedVotes }: Props) {
  const t = useCopy()
  return (
    <>
      {antrag.summarySimplified ? (
        <div className="mb-l rounded-m bg-surface p-m text-s">
          {t.aiSummaryNotice}
        </div>
      ) : null}
      <section>
        <div className="mb-m text-s caption opacity-l">{t.procedure}</div>
        <AntragTimeline
          type={antrag.type}
          beratungsstand={antrag.beratungsstand}
          introducedDate={antrag.introducedDate}
          vote={linkedVotes.length > 0 ? { result: linkedVotes[0].result, date: linkedVotes[0].date } : null}
        />
      </section>
      <AntragSubjectChips subjects={antrag.sachgebiet} />
      {antrag.summaryDetail ? (
        <section className="mt-xl">
          <Markdown serif>{antrag.summaryDetail}</Markdown>
        </section>
      ) : null}
      <AntragSource />
    </>
  )
}
