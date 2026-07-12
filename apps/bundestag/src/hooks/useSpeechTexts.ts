import { useQuery } from '@tanstack/react-query'
import { loadSpeechTexts } from '@/lib/speechesStatic'
import type { Locale } from '@/lib/locale'

export function useSpeechTexts(locale: Locale, enabled = true) {
  return useQuery({
    queryKey: ['speech-texts', locale],
    queryFn: () => loadSpeechTexts(locale),
    enabled,
    staleTime: Infinity,
  })
}
