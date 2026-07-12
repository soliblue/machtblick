import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { VotingRecordTab } from '@/views/memberDetail/VotingRecordTab'

export const Route = createFileRoute('/members/$id/votes')({
  component: MemberVotesRoute,
})

function MemberVotesRoute() {
  const data = useLoaderData({ from: '/members/$id' })
  const { line } = Route.useSearch()
  return <VotingRecordTab history={(data?.history ?? []).filter((vote) => line !== 'abw' || vote.defected === true)} />
}
