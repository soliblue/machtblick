import { useLoaderData, useNavigate, useSearch } from '@tanstack/react-router'
import { AntraegeList } from './AntraegeList'
import { useAntragListFilters } from '@/hooks/useAntragListFilters'

type Props = { from: '/motions/' | '/en/motions/' }

export function AntraegeRouteBody({ from }: Props) {
  const items = useLoaderData({ from }) ?? []
  const { type, party, status, page } = useSearch({ from })
  const navigate = useNavigate({ from })
  const { filtered, availableProposers } = useAntragListFilters(items, type ?? null, party ?? null, status ?? null)
  return (
    <AntraegeList
      items={filtered}
      type={type ?? null}
      onTypeChange={(v) => navigate({ search: (s) => ({ ...s, type: v ?? undefined, page: undefined }) })}
      proposer={party ?? null}
      onProposerChange={(v) => navigate({ search: (s) => ({ ...s, party: v ?? undefined, page: undefined }) })}
      availableProposers={availableProposers}
      status={status ?? null}
      onStatusChange={(v) => navigate({ search: (s) => ({ ...s, status: v ?? undefined, page: undefined }) })}
      page={(page ?? 1) - 1}
      onPageChange={(p) => navigate({ search: (s) => ({ ...s, page: p > 0 ? p + 1 : undefined }) })}
    />
  )
}
