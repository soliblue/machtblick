import { createFileRoute } from '@tanstack/react-router'
import { getBerlinParty } from '@/server/party'
import { pageMeta } from '@/lib/seo'
import { PartyDetail } from '@/views/partyDetail/PartyDetail'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/parties/$slug')({
  component: PartyRoute,
  notFoundComponent: NotFoundPage,
  loader: ({ params }) => getBerlinParty({ data: params.slug }),
  head: ({ loaderData, params }) => pageMeta(
    loaderData ? `${loaderData.party.shortName} zur Berlin-Wahl 2026` : 'Partei',
    loaderData ? `${loaderData.party.name}: Kandidierende und Programm zur Berliner Abgeordnetenhauswahl 2026.` : 'Partei zur Berliner Abgeordnetenhauswahl 2026.',
    `/parties/${loaderData?.party.slug ?? params.slug}/`
  )
})

function PartyRoute() {
  return <PartyDetail data={Route.useLoaderData()} />
}
