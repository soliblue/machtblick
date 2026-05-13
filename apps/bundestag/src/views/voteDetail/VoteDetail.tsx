import type { ReactElement } from 'react'
import type { VoteDetail as VoteDetailData } from '@/server/votes'
import { formatDate } from '@/lib/format'
import { PartyBadge } from '@/views/votesList/PartyBadge'
import { Stamp } from '@/views/votesList/Stamp'
import { deriveStamps } from '@/views/votesList/deriveStamps'
import { MarkdownInline } from '@/lib/MarkdownInline'
import { VoteDetailTabs } from './VoteDetailTabs'
import { ResultTab } from './ResultTab'
import { DetailTab } from './DetailTab'
import { SpeechesTab } from './SpeechesTab'

export type VoteTab = 'ergebnis' | 'details' | 'reden'

export const isVoteTab = (v: unknown): v is VoteTab =>
  v === 'ergebnis' || v === 'details' || v === 'reden'

type Props = {
  data: VoteDetailData
  activeTab: VoteTab
  onTabChange: (t: VoteTab) => void
}

const TAB_PANELS: Record<VoteTab, (data: VoteDetailData) => ReactElement> = {
  ergebnis: (data) => <ResultTab data={data} />,
  details: (data) => <DetailTab data={data} />,
  reden: (data) => <SpeechesTab data={data} />,
}

export function VoteDetail({ data, activeTab, onTabChange }: Props) {
  const { vote, partySummaries, proposingParty } = data
  const stamps = deriveStamps({ ...vote, partySummaries })
  return (
    <main className="mx-auto max-w-3xl p-l">
      {vote.inverted && (
        <div className="mb-l bg-surface p-m text-s">
          Wir haben das Vorzeichen dieser Abstimmung umgedreht, damit das Ergebnis klar lesbar ist. Im Original ging es um die <em>Ablehnung</em> dieses Antrags. Wir zeigen das Ergebnis so, als wäre direkt über den Antrag abgestimmt worden.
        </div>
      )}
      <h1 className="text-xxl font-semibold">{vote.cleanTitle ?? vote.title}</h1>
      {vote.cleanTitle && vote.cleanTitle !== vote.title && (
        <div className="mt-s text-s opacity-l">Offizieller Titel: {vote.title}</div>
      )}
      <div className="mt-s flex items-center gap-m text-m">
        <PartyBadge party={proposingParty} />
        <span className="opacity-l">{formatDate(vote.date)}</span>
        {vote.topic && <span className="opacity-l">· {vote.topic}</span>}
      </div>
      <div className="mt-m mb-l flex flex-wrap items-center gap-l">
        {stamps.map((s) => (
          <Stamp key={s} variant={s} size="m" />
        ))}
      </div>

      {(vote.summarySimplified || vote.summary) && (
        <div className="mb-l">
          <div className="mb-s text-s uppercase opacity-l" style={{ letterSpacing: '0.08em' }}>Zusammenfassung des Antrags</div>
          {vote.summarySimplified
            ? <p className="text-m"><MarkdownInline>{vote.summarySimplified}</MarkdownInline></p>
            : <p className="text-m">{vote.summary}</p>}
        </div>
      )}

      <VoteDetailTabs active={activeTab} onChange={onTabChange} />
      {TAB_PANELS[activeTab](data)}
    </main>
  )
}
