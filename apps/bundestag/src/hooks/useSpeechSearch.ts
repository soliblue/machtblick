import { useQuery } from '@tanstack/react-query'
import { searchSpeechesStatic, speechTextsLoaded } from '@/lib/speechesStatic'
import type { SpeechSearchParams, SpeechSearchResponse } from '@/server/speeches'

export function useSpeechSearch(params: SpeechSearchParams, initialData?: SpeechSearchResponse) {
  const q = params.q?.trim() ?? ''
  const query = useQuery({
    queryKey: ['speech-search', params],
    queryFn: () => searchSpeechesStatic(params),
    initialData,
    staleTime: Infinity,
  })
  const textsLoading = !!q && !speechTextsLoaded() && query.isFetching
  return { data: query.data, isLoading: query.isLoading, isFetching: query.isFetching, textsLoading }
}
