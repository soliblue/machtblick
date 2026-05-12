import { useQuery } from '@tanstack/react-query'
import { loadSpeechTexts, loadSpeechMeta } from '@/lib/speechesStatic'

export function useSpeechBody(speechId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['speech', speechId],
    queryFn: async () => {
      const [meta, texts] = await Promise.all([loadSpeechMeta(), loadSpeechTexts()])
      const entry = meta.find((s) => s.id === speechId)
      return { text: texts[speechId] ?? entry?.excerpt ?? '', date: entry?.date ?? '' }
    },
    enabled,
    staleTime: Infinity,
  })
}
