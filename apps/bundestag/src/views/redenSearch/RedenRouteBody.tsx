import { useLoaderData, useNavigate, useSearch } from '@tanstack/react-router'
import { RedenSearch } from './RedenSearch'
import { useSpeechSearch } from '@/hooks/useSpeechSearch'
import type { Locale } from '@/lib/locale'

type Props = { from: '/speeches/' | '/en/speeches/'; locale: Locale }

export function RedenRouteBody({ from, locale }: Props) {
  const initialData = useLoaderData({ from })
  const { q, party, date, memberId, page } = useSearch({ from })
  const pageIndex = (page ?? 1) - 1
  const search = useSpeechSearch({ q, party, date, memberId, page: pageIndex }, initialData, locale)
  const navigate = useNavigate({ from })
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
