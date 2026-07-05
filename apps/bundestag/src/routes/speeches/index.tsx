import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { searchSpeechesStatic } from '@/lib/speechesStatic'
import { useSpeechSearch } from '@/hooks/useSpeechSearch'
import { RedenSearch } from '@/views/redenSearch/RedenSearch'
import { seoMeta, canonicalLink, breadcrumbJsonLd } from '@/lib/seo'

type Search = { q?: string; party?: string; date?: string; memberId?: string; page?: number }

export const Route = createFileRoute('/speeches/')({
  component: RedenRoute,
  loaderDeps: ({ search }) => ({
    q: search.q ?? '',
    party: search.party ?? '',
    date: search.date ?? '',
    memberId: search.memberId ?? '',
    page: (search.page ?? 1) - 1,
  }),
  loader: ({ deps }) => searchSpeechesStatic(deps, 'de'),
  head: () => ({
    meta: seoMeta({
      title: 'Reden',
      description: 'Alle Reden des Deutschen Bundestags im Volltext durchsuchen und nach Stichwort, Fraktion, Datum und Abgeordneten filtern.',
      canonical: '/speeches',
    }),
    links: canonicalLink('/speeches'),
    scripts: breadcrumbJsonLd([{ name: 'Machtblick', path: '/' }, { name: 'Reden', path: '/speeches' }]),
  }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === 'string' && s.q ? s.q : undefined,
    party: typeof s.party === 'string' && s.party ? s.party : undefined,
    date: typeof s.date === 'string' && s.date ? s.date : undefined,
    memberId: typeof s.memberId === 'string' && s.memberId ? s.memberId : undefined,
    page: typeof s.page === 'number' && s.page > 1 ? s.page : undefined,
  }),
})

function RedenRoute() {
  const initialData = Route.useLoaderData()
  const { q, party, date, memberId, page } = Route.useSearch()
  const pageIndex = (page ?? 1) - 1
  const search = useSpeechSearch({ q, party, date, memberId, page: pageIndex }, initialData, 'de')
  const navigate = useNavigate({ from: Route.fullPath })
  return (
    <RedenSearch
      data={search.data ?? initialData}
      textsLoading={search.textsLoading}
      query={q ?? ''}
      party={party ?? null}
      date={date ?? null}
      memberId={memberId ?? null}
      page={pageIndex}
      onQueryChange={(v) => navigate({ search: (s) => ({ ...s, q: v || undefined, page: undefined }) })}
      onPartyChange={(v) => navigate({ search: (s) => ({ ...s, party: v ?? undefined, page: undefined }) })}
      onDateChange={(v) => navigate({ search: (s) => ({ ...s, date: v ?? undefined, page: undefined }) })}
      onMemberChange={(v) => navigate({ search: (s) => ({ ...s, memberId: v ?? undefined, page: undefined }) })}
      onPageChange={(p) => navigate({ search: (s) => ({ ...s, page: p > 0 ? p + 1 : undefined }) })}
    />
  )
}
