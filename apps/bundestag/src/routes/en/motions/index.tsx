import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { listAntraege } from '@/server/antraege'
import { AntraegeList } from '@/views/antraegeList/AntraegeList'
import { useAntragListFilters, type AntragTypeFilter } from '@/hooks/useAntragListFilters'
import type { MotionStatusBucket } from '@/lib/motionStatus'
import { seoMeta, canonicalLink, breadcrumbJsonLd } from '@/lib/seo'

const isType = (v: unknown): v is AntragTypeFilter => v === 'antrag' || v === 'gesetzentwurf'
const isStatus = (v: unknown): v is MotionStatusBucket => v === 'angenommen' || v === 'abgelehnt' || v === 'im-verfahren' || v === 'nicht-beraten'

type Search = { type?: AntragTypeFilter; party?: string; status?: MotionStatusBucket; page?: number }

export const Route = createFileRoute('/en/motions/')({
  component: AntraegeRoute,
  loader: () => listAntraege({ data: 'en' }),
  head: () => ({
    meta: seoMeta({
      title: 'Motions',
      description: 'All motions and bills in the German Bundestag: who proposes them, where they stand in the process, and how parliament decided.',
      canonical: '/en/motions',
    }),
    links: canonicalLink('/en/motions'),
    scripts: breadcrumbJsonLd([{ name: 'Machtblick', path: '/en' }, { name: 'Motions', path: '/en/motions' }]),
  }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    type: isType(s.type) ? s.type : undefined,
    party: typeof s.party === 'string' && s.party ? s.party : undefined,
    status: isStatus(s.status) ? s.status : undefined,
    page: typeof s.page === 'number' && s.page > 1 ? s.page : undefined,
  }),
})

function AntraegeRoute() {
  const items = Route.useLoaderData() ?? []
  const { type, party, status, page } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
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
