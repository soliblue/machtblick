import type { VoteDetail as VoteDetailData } from '@/server/voteDetail'
import { Markdown } from '@/lib/Markdown'
import { useCopy } from '@/lib/i18n'

type Props = { data: VoteDetailData }

export function DetailTab({ data }: Props) {
  const { vote } = data
  const t = useCopy()
  const drucksache = data.documents.find((d) => d.url === data.antragPdfUrl)?.label
  return vote.summaryDetail ? (
    <section>
      <div className="mb-m bg-surface p-m text-s">
        {t.aiSummaryNotice}
        {data.antragPdfUrl && (
          <> {t.fullMotion} <a href={data.antragPdfUrl} target="_blank" rel="noreferrer" className="underline">{drucksache ? `Drucksache ${drucksache} (PDF)` : t.sourcePdf}</a>.</>
        )}
      </div>
      <Markdown serif>{vote.summaryDetail}</Markdown>
    </section>
  ) : (
    <p className="text-m opacity-l">{t.noSimplifiedSummary}</p>
  )
}
