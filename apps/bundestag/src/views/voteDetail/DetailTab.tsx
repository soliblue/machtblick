import type { VoteDetail as VoteDetailData } from '@/server/votes'
import { Markdown } from '@/lib/Markdown'

type Props = { data: VoteDetailData }

export function DetailTab({ data }: Props) {
  const { vote } = data
  return vote.summaryDetail ? (
    <section>
      <div className="mb-m bg-surface p-m text-s">
        Diese Zusammenfassung basiert auf dem Antragstext, wurde KI-generiert und sprachlich vereinfacht.
        {data.antragPdfUrl && (
          <> Den vollständigen Antrag findest du <a href={data.antragPdfUrl} target="_blank" rel="noreferrer" className="underline">hier</a>.</>
        )}
      </div>
      <Markdown>{vote.summaryDetail}</Markdown>
    </section>
  ) : (
    <p className="text-m opacity-l">Noch keine vereinfachte Beschreibung verfügbar.</p>
  )
}
