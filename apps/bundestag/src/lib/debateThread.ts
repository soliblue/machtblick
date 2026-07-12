import type { SpeechSummary } from '@/server/speeches'

export type ThreadRow<T extends SpeechSummary> =
  | { kind: 'system'; speech: T }
  | { kind: 'turn'; speech: T; nested: boolean; compact: boolean; turnIndex: number }

const PRESIDIUM = /^(alters|vize)?präsident/i

function isPresidium(speech: Pick<SpeechSummary, 'speakerRole'>): boolean {
  return !!speech.speakerRole && PRESIDIUM.test(speech.speakerRole)
}

export function buildDebateThread<T extends SpeechSummary>(speeches: T[]): ThreadRow<T>[] {
  const turns = speeches.filter((s) => !isPresidium(s))
  const speakerKey = (s: T) => s.speakerMemberId ?? s.speakerName
  const nestedIds = new Set<string>()
  let floor: string | null = null
  turns.forEach((turn, i) => {
    const key = speakerKey(turn)
    if (floor === null || key === floor) {
      floor = key
    } else if (turns.slice(i + 1, i + 3).some((later) => speakerKey(later) === floor)) {
      nestedIds.add(turn.id)
    } else {
      floor = key
    }
  })
  let turnIndex = 0
  return speeches.map((speech) => isPresidium(speech)
    ? { kind: 'system' as const, speech }
    : {
        kind: 'turn' as const,
        speech,
        nested: nestedIds.has(speech.id),
        compact: speech.contributionType === 'short' && !nestedIds.has(speech.id),
        turnIndex: turnIndex++,
      })
}
