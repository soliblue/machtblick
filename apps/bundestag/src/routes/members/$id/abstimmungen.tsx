import { useState } from 'react'
import { createFileRoute, useLoaderData, useNavigate } from '@tanstack/react-router'
import { VotingRecordTab } from '@/views/memberDetail/VotingRecordTab'

type Search = { line?: string }

export const Route = createFileRoute('/members/$id/abstimmungen')({
  component: AbstimmungenRoute,
  validateSearch: (s: Record<string, unknown>): Search => ({
    line: typeof s.line === 'string' ? s.line : undefined,
  }),
})

function AbstimmungenRoute() {
  const data = useLoaderData({ from: '/members/$id' })
  const { line } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const params = Route.useParams()
  const [choiceFilter, setChoiceFilter] = useState<string | null>(null)
  const setLineFilter = (v: string | null) => {
    navigate({ to: '/members/$id/abstimmungen/', params, search: { line: v ?? undefined } })
  }
  return (
    <VotingRecordTab
      history={data.history}
      lineFilter={line ?? null}
      setLineFilter={setLineFilter}
      choiceFilter={choiceFilter}
      setChoiceFilter={setChoiceFilter}
    />
  )
}
