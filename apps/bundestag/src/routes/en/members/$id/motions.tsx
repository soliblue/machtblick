import { createFileRoute, useLoaderData, useNavigate } from '@tanstack/react-router'
import { ProposalsTab } from '@/views/memberDetail/ProposalsTab'
import type { MemberProposalVoteLinkFilter } from '@/hooks/useMemberProposalFilters'

type Search = { status?: string; topic?: string; vote?: MemberProposalVoteLinkFilter; q?: string }

const normalizeVoteLinkFilter = (v: unknown): MemberProposalVoteLinkFilter | undefined =>
  v === 'with' || v === 'mit' ? 'with'
  : v === 'without' || v === 'ohne' ? 'without'
  : undefined

export const Route = createFileRoute('/en/members/$id/motions')({
  component: AntraegeRoute,
  validateSearch: (s: Record<string, unknown>): Search => ({
    status: typeof s.status === 'string' ? s.status : typeof s.stand === 'string' ? s.stand : undefined,
    topic: typeof s.topic === 'string' ? s.topic : typeof s.thema === 'string' ? s.thema : undefined,
    vote: normalizeVoteLinkFilter(s.vote ?? s.abstimmung),
    q: typeof s.q === 'string' ? s.q : undefined,
  }),
})

function AntraegeRoute() {
  const data = useLoaderData({ from: '/en/members/$id' })
  const { status, topic, vote, q } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  return (
    <ProposalsTab
      proposals={data?.initiatives ?? []}
      statusFilter={status ?? null}
      setStatusFilter={(v) => navigate({ search: (s) => ({ ...s, stand: undefined, status: v ?? undefined }), resetScroll: false, replace: true })}
      topicFilter={topic ?? null}
      setTopicFilter={(v) => navigate({ search: (s) => ({ ...s, thema: undefined, topic: v ?? undefined }), resetScroll: false, replace: true })}
      voteLinkFilter={vote ?? null}
      setVoteLinkFilter={(v) => navigate({ search: (s) => ({ ...s, abstimmung: undefined, vote: v ?? undefined }), resetScroll: false, replace: true })}
      query={q ?? ''}
      setQuery={(v) => navigate({ search: (s) => ({ ...s, q: v || undefined }), resetScroll: false, replace: true })}
    />
  )
}
