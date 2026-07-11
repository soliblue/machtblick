import { useState } from 'react'
import { ConversationBubble } from './ConversationBubble'
import { ConversationSystemChip } from './ConversationSystemChip'
import type { ThreadRow } from '@/hooks/debateThread'
import type { SpeechSummary } from '@/server/speeches'
import type { SpeechBallotChoice } from '@/lib/speechesStatic'

type Props<T extends SpeechSummary> = {
  rows: ThreadRow<T>[]
  choiceFor?: (speech: T) => SpeechBallotChoice | null
  pictureFor?: (speech: T) => string | null
  fullTextFor?: (speech: T) => string | null | undefined
  fullTextLoading?: boolean
  onExpandTurn?: (speech: T) => void
  highlightMemberId?: string | null
  highlightColor?: string
  query?: string
  onOpenTurn: (turnIndex: number) => void
}

export function DebateThread<T extends SpeechSummary>({
  rows,
  pictureFor = () => null,
  fullTextFor,
  fullTextLoading = false,
  onExpandTurn,
  highlightMemberId = null,
  highlightColor = 'var(--color-fg)',
  query = '',
  onOpenTurn,
}: Props<T>) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  return (
    <div className="flex flex-col gap-l">
      {rows.map((row) => {
        const isExpanded = row.kind === 'turn' && expanded.has(row.speech.id)
        return (
          row.kind === 'system' ? (
            <ConversationSystemChip key={row.speech.id} speakerName={row.speech.speakerName} text={row.speech.excerpt} />
          ) : (
            <div key={row.speech.id} className={row.nested ? 'pl-xl' : 'pr-xl'}>
              <ConversationBubble
                speech={row.speech}
                pictureUrl={pictureFor(row.speech)}
                expanded={isExpanded}
                fullText={fullTextFor?.(row.speech) ?? null}
                loading={fullTextLoading}
                query={query}
                highlighted={highlightMemberId !== null && row.speech.speakerMemberId === highlightMemberId}
                highlightColor={highlightColor}
                onExpand={() => {
                  setExpanded((value) => new Set(value).add(row.speech.id))
                  onExpandTurn?.(row.speech)
                }}
                onCollapse={() => {
                  setExpanded((value) => {
                    const next = new Set(value)
                    next.delete(row.speech.id)
                    return next
                  })
                }}
                onOpenReader={() => onOpenTurn(row.turnIndex)}
              />
            </div>
          )
        )
      })}
    </div>
  )
}
