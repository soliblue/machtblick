import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { PartyProfilePanel } from '@/views/partyDetail/PartyProfilePanel'

export const Route = createFileRoute('/en/parties/$id/profile')({
  component: ProfilRoute,
})

function ProfilRoute() {
  const data = useLoaderData({ from: '/en/parties/$id' })
  return data ? <PartyProfilePanel data={data} /> : null
}
