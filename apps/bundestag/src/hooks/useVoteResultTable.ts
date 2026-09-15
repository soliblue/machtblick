import type { VoteDetail } from '@/server/voteDetail'
import { useCopy } from '@/lib/i18n'

export type VoteResultTableData = {
  vote: Pick<VoteDetail['vote'], 'yes' | 'no' | 'abstain' | 'absent' | 'totalMembers' | 'voteType'>
  partySummaries: VoteDetail['partySummaries']
}

export function useVoteResultTable({ vote, partySummaries }: VoteResultTableData) {
  const t = useCopy()
  const rows = [
    {
      party: null,
      yes: vote.yes,
      no: vote.no,
      abstain: vote.abstain,
      absent: vote.voteType === 'namentlich' ? vote.absent : null,
      unknown: Math.max(0, vote.totalMembers - vote.yes - vote.no - vote.abstain - (vote.absent ?? 0)),
    },
    ...[...partySummaries].sort((a, b) => b.members - a.members).map((party) => ({
      party: party.party,
      yes: party.yes,
      no: party.no,
      abstain: party.abstain,
      absent: vote.voteType === 'namentlich' ? party.absent : null,
      unknown: Math.max(0, party.members - party.yes - party.no - party.abstain - (vote.voteType === 'namentlich' ? party.absent : 0)),
    })),
  ]
  const columns = [
    { key: 'yes', label: t.yes, shortLabel: t.yes, color: 'text-success' },
    { key: 'no', label: t.no, shortLabel: t.no, color: 'text-danger' },
    { key: 'abstain', label: t.abstention, shortLabel: t.abstainShort, color: 'text-yellow' },
    { key: 'absent', label: t.absentLabel, shortLabel: t.absentShort, color: 'text-fg/70' },
    ...(rows.some((row) => row.unknown > 0)
      ? [{ key: 'unknown' as const, label: t.noDataLabel, shortLabel: t.noDataLabel, color: 'text-fg/70' }]
      : []),
  ] as const
  return { rows, columns }
}
