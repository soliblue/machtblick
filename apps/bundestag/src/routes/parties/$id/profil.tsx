import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { PartyProfilePanel } from '@/views/partyDetail/PartyProfilePanel'

export const Route = createFileRoute('/parties/$id/profil')({
  component: ProfilRoute,
})

function ProfilRoute() {
  const data = useLoaderData({ from: '/parties/$id' })
  return data ? <PartyProfilePanel data={data} /> : null
}
