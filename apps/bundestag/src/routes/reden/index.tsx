import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { searchSpeechesStatic } from '@/lib/speechesStatic'
import { RedenSearch } from '@/views/redenSearch/RedenSearch'
import { seoMeta, canonicalLink } from '@/lib/seo'

type Search = { q?: string; party?: string; date?: string; memberId?: string; page?: number }

export const Route = createFileRoute('/reden/')({
  component: RedenRoute,
  loaderDeps: ({ search }) => ({
    q: search.q ?? '',
    party: search.party ?? '',
    date: search.date ?? '',
    memberId: search.memberId ?? '',
    page: search.page ?? 0,
  }),
  loader: ({ deps }) => searchSpeechesStatic(deps),
  head: () => ({
    meta: seoMeta({
      title: 'Reden',
      description: 'Reden des Deutschen Bundestags durchsuchen — nach Stichwort und Fraktion.',
      canonical: '/reden',
    }),
    links: canonicalLink('/reden'),
  }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === 'string' && s.q ? s.q : undefined,
    party: typeof s.party === 'string' && s.party ? s.party : undefined,
    date: typeof s.date === 'string' && s.date ? s.date : undefined,
    memberId: typeof s.memberId === 'string' && s.memberId ? s.memberId : undefined,
    page: typeof s.page === 'number' && s.page > 0 ? s.page : undefined,
  }),
})

function RedenRoute() {
  const data = Route.useLoaderData()
  const { q, party, date, memberId, page } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  return (
    <RedenSearch
      data={data}
      query={q ?? ''}
      party={party ?? null}
      date={date ?? null}
      memberId={memberId ?? null}
      page={page ?? 0}
      onQueryChange={(v) => navigate({ search: (s) => ({ ...s, q: v || undefined, page: undefined }) })}
      onPartyChange={(v) => navigate({ search: (s) => ({ ...s, party: v ?? undefined, page: undefined }) })}
      onDateChange={(v) => navigate({ search: (s) => ({ ...s, date: v ?? undefined, page: undefined }) })}
      onMemberChange={(v) => navigate({ search: (s) => ({ ...s, memberId: v ?? undefined, page: undefined }) })}
      onPageChange={(p) => navigate({ search: (s) => ({ ...s, page: p > 0 ? p : undefined }) })}
    />
  )
}
