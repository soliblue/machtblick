import { createFileRoute } from '@tanstack/react-router'
import { getBerlinElectionGuide } from '@/server/election'
import { pageMeta } from '@/lib/seo'
import { ElectionGuide } from '@/views/election/ElectionGuide'

export const Route = createFileRoute('/election')({
  component: ElectionRoute,
  loader: () => getBerlinElectionGuide(),
  head: () => pageMeta(
    'So funktioniert die Berlin-Wahl 2026',
    'Erststimme, Zweitstimme, Sitzverteilung und Wahlberechtigung zur Berliner Abgeordnetenhauswahl 2026 einfach erklärt.',
    '/election/'
  )
})

function ElectionRoute() {
  return <ElectionGuide data={Route.useLoaderData()} />
}
