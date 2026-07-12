import { createFileRoute, Outlet } from '@tanstack/react-router'
import { getMember } from '@/server/memberDetail'
import { MemberDetailShell } from '@/views/memberDetail/MemberDetailShell'
import { memberDetailHead } from '@/lib/routeHeads'
import { validateMemberLineSearch } from '@/lib/searchParams'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/en/members/$id')({
  component: MemberDetailLayout,
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  loader: ({ params }) => getMember({ data: { id: params.id, locale: 'en' } }),
  staleTime: Infinity,
  shouldReload: false,
  validateSearch: validateMemberLineSearch,
  head: ({ loaderData, params }) => memberDetailHead(loaderData, params, 'en'),
})

function MemberDetailLayout() {
  const data = Route.useLoaderData()
  const { line } = Route.useSearch()
  return (
    <MemberDetailShell data={data} deviationsOnly={line === 'abw'}>
      <Outlet />
    </MemberDetailShell>
  )
}
