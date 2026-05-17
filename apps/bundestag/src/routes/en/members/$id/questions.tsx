import { createFileRoute } from '@tanstack/react-router'
import { getAnfragenForMember } from '@/server/anfragen'
import { AnfragenTab } from '@/views/memberDetail/AnfragenTab'

export const Route = createFileRoute('/en/members/$id/questions')({
  component: AnfragenRoute,
  loader: ({ params }) => getAnfragenForMember({ data: params.id }),
  staleTime: Infinity,
  shouldReload: false,
})

function AnfragenRoute() {
  const data = Route.useLoaderData()
  return <AnfragenTab data={data} />
}
