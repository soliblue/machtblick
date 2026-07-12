import { joinSpeechTexts } from '@/lib/speechesStatic'
import type { Locale } from '@/lib/locale'
import { useSpeechTexts } from './useSpeechTexts'

export function useSpeechBody(ids: string[], enabled: boolean, locale: Locale = 'de') {
  const texts = useSpeechTexts(locale, enabled)
  const text = texts.data ? joinSpeechTexts(ids, texts.data) : ''
  const fallback = useSpeechTexts('de', enabled && locale === 'en' && !!texts.data && !text)
  return { data: texts.data ? { text: text || joinSpeechTexts(ids, fallback.data ?? {}) } : undefined }
}
