import { useQuery } from '@tanstack/react-query'
import { loadSpeechTexts, loadSpeechMeta } from '@/lib/speechesStatic'
import type { Locale } from '@/lib/locale'

export function useSpeechBody(speechId: string, enabled: boolean, locale: Locale = 'de') {
  return useQuery({
    queryKey: ['speech', locale, speechId],
    queryFn: async () => {
      const [meta, texts] = await Promise.all([loadSpeechMeta(), loadSpeechTexts(locale)])
      const entry = meta.find((s) => s.id === speechId)
      return { text: texts[speechId] ?? entry?.excerpt ?? '', date: entry?.date ?? '' }
    },
    enabled,
    staleTime: Infinity,
  })
}
