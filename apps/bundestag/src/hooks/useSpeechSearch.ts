import { useQuery } from '@tanstack/react-query'
import { searchSpeechesStatic, speechTextsLoaded } from '@/lib/speechesStatic'
import type { SpeechSearchParams, SpeechSearchResponse } from '@/server/speeches'
import type { Locale } from '@/lib/locale'

export function useSpeechSearch(params: SpeechSearchParams, initialData?: SpeechSearchResponse, locale: Locale = 'de') {
  const q = params.q?.trim() ?? ''
  const query = useQuery({
    queryKey: ['speech-search', locale, params],
    queryFn: () => searchSpeechesStatic(params, locale),
    initialData,
    staleTime: Infinity,
  })
  const textsLoading = !!q && !speechTextsLoaded(locale) && query.isFetching
  return { data: query.data, isLoading: query.isLoading, isFetching: query.isFetching, textsLoading }
}
