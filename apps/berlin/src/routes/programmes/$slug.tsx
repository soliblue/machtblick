import { createFileRoute } from '@tanstack/react-router'
import { getBerlinProgramme } from '@/server/programmes'
import { pageMeta } from '@/lib/seo'
import { ProgrammeDetail } from '@/views/programmeDetail/ProgrammeDetail'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/programmes/$slug')({
  component: ProgrammeRoute,
  notFoundComponent: NotFoundPage,
  loader: ({ params }) => getBerlinProgramme({ data: params.slug }),
  head: ({ loaderData, params }) => pageMeta(
    loaderData ? `${loaderData.party.shortName}: ${loaderData.programme.title}` : 'Wahlprogramm',
    loaderData?.programme.summary ?? 'Wahlprogramm zur Berliner Abgeordnetenhauswahl 2026.',
    `/programmes/${loaderData?.party.slug ?? params.slug}/`
  )
})

function ProgrammeRoute() {
  return <ProgrammeDetail data={Route.useLoaderData()} />
}
