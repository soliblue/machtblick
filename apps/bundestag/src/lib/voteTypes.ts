import type { VoteTypeFilter } from '@/hooks/useVoteListFilters'

export const SHOW_HAMMELSPRUNG = false

export const VISIBLE_VOTE_TYPES: VoteTypeFilter[] = SHOW_HAMMELSPRUNG
  ? ['namentlich', 'handzeichen', 'hammelsprung']
  : ['namentlich', 'handzeichen']
