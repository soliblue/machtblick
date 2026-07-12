import { createFileRoute } from '@tanstack/react-router'
import { searchSpeechesStatic } from '@/lib/speechesStatic'
import { RedenRouteBody } from '@/views/redenSearch/RedenRouteBody'
import { speechesLoaderDeps, validateSpeechesSearch } from '@/lib/searchParams'
import { speechesListHead } from '@/lib/routeHeads'

export const Route = createFileRoute('/speeches/')({
  component: () => <RedenRouteBody from="/speeches/" locale="de" />,
  loaderDeps: speechesLoaderDeps,
  loader: ({ deps }) => searchSpeechesStatic(deps, 'de'),
  head: () => speechesListHead('de'),
  validateSearch: validateSpeechesSearch,
})
