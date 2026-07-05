import { SpeechEntry } from './SpeechEntry'
import { CompactTurnRow } from './CompactTurnRow'
import { SystemRow } from './SystemRow'
import type { ThreadRow } from '@/hooks/debateThread'
import type { SpeechSummary } from '@/server/speeches'
import type { SpeechBallotChoice } from '@/lib/speechesStatic'

type Props<T extends SpeechSummary> = {
  rows: ThreadRow<T>[]
  choiceFor?: (speech: T) => SpeechBallotChoice | null
  pictureFor?: (speech: T) => string | null
  query?: string
  onOpenTurn: (turnIndex: number) => void
}

export function DebateThread<T extends SpeechSummary>({ rows, choiceFor = () => null, pictureFor = () => null, query = '', onOpenTurn }: Props<T>) {
  return (
    <div className="relative pl-[48px]">
      <span className="absolute inset-y-0 left-[17px] border-l border-fg/15" aria-hidden="true" />
      {rows.map((row) =>
        row.kind === 'system' ? (
          <SystemRow key={row.speech.id} speakerName={row.speech.speakerName} text={row.speech.excerpt} />
        ) : row.compact ? (
          <CompactTurnRow
            key={row.speech.id}
            speech={row.speech}
            pictureUrl={pictureFor(row.speech)}
            onOpen={() => onOpenTurn(row.turnIndex)}
          />
        ) : (
          <SpeechEntry
            key={row.speech.id}
            speech={row.speech}
            mode="turn"
            nested={row.nested}
            choice={choiceFor(row.speech)}
            pictureUrl={pictureFor(row.speech)}
            query={query}
            onOpen={() => onOpenTurn(row.turnIndex)}
          />
        ),
      )}
    </div>
  )
}
