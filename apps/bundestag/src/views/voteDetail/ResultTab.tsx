import type { VoteDetail as VoteDetailData } from '@/server/voteDetail'
import { useVoteResultTable } from '@/hooks/useVoteResultTable'
import { VoteResultTable } from './VoteResultTable'
import { useCopy } from '@/lib/i18n'

type Props = { data: VoteDetailData }

export function ResultTab({ data }: Props) {
  const t = useCopy()
  return (
    <>
      <div className="mb-l rounded-m bg-surface p-m text-s">
        {t.officialDataNoticePrefix}{' '}
        <a href={data.vote.sourceUrl ?? undefined} target="_blank" rel="noreferrer" className="underline">
          {t.officialDataNoticeLink}
        </a>
        .
      </div>
      <VoteResultTable {...useVoteResultTable(data)} />
    </>
  )
}
