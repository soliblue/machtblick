import { useQuery } from '@tanstack/react-query'
import { joinSpeechTexts, loadSpeechTexts } from '@/lib/speechesStatic'
import type { Locale } from '@/lib/locale'

export function useSpeechBody(ids: string[], enabled: boolean, locale: Locale = 'de') {
  return useQuery({
    queryKey: ['speech', locale, ids.join(',')],
    queryFn: async () => {
      const texts = await loadSpeechTexts(locale)
      const text = joinSpeechTexts(ids, texts)
      if (text || locale === 'de') return { text }
      return { text: joinSpeechTexts(ids, await loadSpeechTexts('de')) }
    },
    enabled,
    staleTime: Infinity,
  })
}
