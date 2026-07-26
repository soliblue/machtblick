import { createFileRoute } from '@tanstack/react-router'
import { getBerlinProgrammes } from '@/server/programmes'
import { ProgrammesList } from '@/views/programmes/ProgrammesList'
import { pageMeta } from '@/lib/seo'

export const Route = createFileRoute('/programmes/')({
  component: ProgrammesRoute,
  loader: () => getBerlinProgrammes(),
  head: () => pageMeta(
    'Wahlprogramme zur Berlin-Wahl 2026',
    'Veröffentlichte Wahlprogramme und Programmmaterialien der zugelassenen Parteien zur Berlin-Wahl 2026.',
    '/programmes/'
  )
})

function ProgrammesRoute() {
  return <ProgrammesList programmes={Route.useLoaderData()} />
}
