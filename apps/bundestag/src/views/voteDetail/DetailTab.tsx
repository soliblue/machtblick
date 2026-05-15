import type { VoteDetail as VoteDetailData } from '@/server/votes'
import { Markdown } from '@/lib/Markdown'
import { useCopy } from '@/lib/i18n'

type Props = { data: VoteDetailData }

export function DetailTab({ data }: Props) {
  const { vote } = data
  const t = useCopy()
  return vote.summaryDetail ? (
    <section>
      <div className="mb-m bg-surface p-m text-s">
        {t.aiSummaryNotice}
        {data.antragPdfUrl && (
          <> {t.fullMotion} <a href={data.antragPdfUrl} target="_blank" rel="noreferrer" className="underline">{t.here}</a>.</>
        )}
      </div>
      <Markdown>{vote.summaryDetail}</Markdown>
    </section>
  ) : (
    <p className="text-m opacity-l">{t.noSimplifiedSummary}</p>
  )
}
