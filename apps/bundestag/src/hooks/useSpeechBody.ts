import { useQuery } from '@tanstack/react-query'
import { getSpeechStatic } from '@/lib/speechesStatic'

export function useSpeechBody(speechId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['speech', speechId],
    queryFn: () => getSpeechStatic(speechId),
    enabled,
    staleTime: Infinity,
  })
}
