import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { PartyDetailShell } from '@/views/partyDetail/PartyDetailShell'

export const Route = createFileRoute('/parties/$id/')({
  component: PartyRoute,
})

function PartyRoute() {
  const data = useLoaderData({ from: '/parties/$id' })
  return data ? <PartyDetailShell data={data.detail} history={data.history} /> : null
}
