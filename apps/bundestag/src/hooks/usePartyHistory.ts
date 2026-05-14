import { useQuery } from '@tanstack/react-query'
import { getPartyHistory } from '@/server/getPartyHistory'

export function usePartyHistory(slug: string) {
  return useQuery({
    queryKey: ['partyHistory', slug],
    queryFn: () => getPartyHistory({ data: slug }),
    staleTime: Infinity,
  })
}
