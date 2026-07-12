import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { listVotes } from '@/server/votes'
import { VotesRouteBody } from '@/views/votesList/VotesRouteBody'
import type { VoteFlagFilter } from '@/hooks/useVoteFlags'
import { validateVotesSearch } from '@/lib/searchParams'
import { votesListHead } from '@/lib/routeHeads'

export const Route = createFileRoute('/en/votes/')({
  component: () => <VotesRouteBody from="/en/votes/" />,
  loader: () => listVotes({ data: 'en' }),
  head: () => votesListHead('en'),
  validateSearch: validateVotesSearch,
  search: { middlewares: [stripSearchParams({ flag: 'all' as VoteFlagFilter })] },
})
