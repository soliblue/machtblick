import type { VoteDetail as VoteDetailData } from '@/server/votes'
import { DebateList } from './DebateList'

type Props = { data: VoteDetailData }

export function SpeechesTab({ data }: Props) {
  return data.debate.length > 0
    ? <DebateList speeches={data.debate} />
    : <p className="text-m opacity-l">Noch keine Reden verfügbar.</p>
}
