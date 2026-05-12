import { SpeechRow } from './SpeechRow'
import type { SpeechResult } from '@/server/speeches'

export function SpeechResultRow({ speech, query = '' }: { speech: SpeechResult; query?: string }) {
  return <SpeechRow speech={speech} query={query} />
}
