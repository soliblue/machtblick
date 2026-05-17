import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { searchSpeechesStatic } from '@/lib/speechesStatic'
import { useSpeechSearch } from '@/hooks/useSpeechSearch'
import { RedenSearch } from '@/views/redenSearch/RedenSearch'
import { seoMeta, canonicalLink } from '@/lib/seo'

type Search = { q?: string; party?: string; date?: string; memberId?: string; page?: number }

export const Route = createFileRoute('/en/speeches/')({
  component: RedenRoute,
  loaderDeps: ({ search }) => ({
    q: search.q ?? '',
    party: search.party ?? '',
    date: search.date ?? '',
    memberId: search.memberId ?? '',
    page: search.page ?? 0,
  }),
  loader: ({ deps }) => searchSpeechesStatic(deps, 'en'),
  head: () => ({
    meta: seoMeta({
      title: 'Speeches',
      description: 'Search speeches from the German Bundestag by keyword, parliamentary group, date, and member.',
      canonical: '/en/speeches',
    }),
    links: canonicalLink('/en/speeches'),
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
  const initialData = Route.useLoaderData()
  const { q, party, date, memberId, page } = Route.useSearch()
  const search = useSpeechSearch({ q, party, date, memberId, page }, initialData, 'en')
  const navigate = useNavigate({ from: Route.fullPath })
  return (
    <RedenSearch
      data={search.data ?? initialData}
      textsLoading={search.textsLoading}
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
