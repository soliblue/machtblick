import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { listVotes } from '@/server/votes'
import { VotesRouteBody } from '@/views/votesList/VotesRouteBody'
import type { VoteFlagFilter } from '@/hooks/useVoteFlags'
import { validateVotesSearch } from '@/lib/searchParams'
import { votesListHead } from '@/lib/routeHeads'

export const Route = createFileRoute('/votes/')({
  component: () => <VotesRouteBody from="/votes/" />,
  loader: () => listVotes({ data: 'de' }),
  head: () => votesListHead('de'),
  validateSearch: validateVotesSearch,
  search: { middlewares: [stripSearchParams({ flag: 'all' as VoteFlagFilter })] },
})
