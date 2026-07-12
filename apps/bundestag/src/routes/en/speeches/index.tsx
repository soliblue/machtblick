import { createFileRoute } from '@tanstack/react-router'
import { searchSpeechesStatic } from '@/lib/speechesStatic'
import { RedenRouteBody } from '@/views/redenSearch/RedenRouteBody'
import { speechesLoaderDeps, validateSpeechesSearch } from '@/lib/searchParams'
import { speechesListHead } from '@/lib/routeHeads'

export const Route = createFileRoute('/en/speeches/')({
  component: () => <RedenRouteBody from="/en/speeches/" locale="en" />,
  loaderDeps: speechesLoaderDeps,
  loader: ({ deps }) => searchSpeechesStatic(deps, 'en'),
  head: () => speechesListHead('en'),
  validateSearch: validateSpeechesSearch,
})
