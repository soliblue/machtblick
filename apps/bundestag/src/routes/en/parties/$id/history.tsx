import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { PartyHistoryPanel } from '@/views/partyDetail/PartyHistoryPanel'
import { PARTY_COLOR, partyLabel } from '@/lib/parties'
import { getPartyHistory } from '@/server/getPartyHistory'

export const Route = createFileRoute('/en/parties/$id/history')({
  loader: ({ params }) => getPartyHistory({ data: params.id }),
  component: VerlaufRoute,
})

function VerlaufRoute() {
  const parent = useLoaderData({ from: '/en/parties/$id' })
  const history = Route.useLoaderData()
  return parent ? (
    <PartyHistoryPanel
      history={history}
      partyLabel={partyLabel(parent.party, 'en')}
      partyColor={PARTY_COLOR[parent.party] ?? 'var(--color-gray)'}
    />
  ) : null
}
