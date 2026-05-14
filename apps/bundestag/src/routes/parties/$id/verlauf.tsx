import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { PartyHistoryPanel } from '@/views/partyDetail/PartyHistoryPanel'
import { PARTY_COLOR, PARTY_LABEL } from '@/lib/parties'

export const Route = createFileRoute('/parties/$id/verlauf')({
  component: VerlaufRoute,
})

function VerlaufRoute() {
  const data = useLoaderData({ from: '/parties/$id' })
  return data ? (
    <PartyHistoryPanel
      slug={data.slug}
      partyLabel={PARTY_LABEL[data.party] ?? data.party}
      partyColor={PARTY_COLOR[data.party] ?? 'var(--color-gray)'}
    />
  ) : null
}
