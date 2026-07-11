import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { tokenize } from '@/lib/highlight'
import { makeSnippet } from '@/lib/snippet'
import { loadSpeechMeta, loadSpeechTexts, speechTextsLoaded } from '@/lib/speechesStatic'
import type { Locale } from '@/lib/locale'
import type { SpeechResult } from '@/server/speeches'
import { contextRowsForGroup, groupMemberSpeeches, memberSpeechGroupTitle, type MemberSpeechGroup } from './memberSpeechGroups'

const BATCH_SIZE = 8

export function useMemberSpeeches(speeches: SpeechResult[], locale: Locale) {
  const [query, setQueryState] = useState('')
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE)
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const terms = useMemo(() => tokenize(query), [query])
  const groups = useMemo(() => groupMemberSpeeches(speeches), [speeches])
  const texts = useQuery({
    queryKey: ['speech-texts', locale],
    queryFn: () => loadSpeechTexts(locale),
    enabled: terms.length > 0,
    staleTime: Infinity,
  })
  const meta = useQuery({
    queryKey: ['speech-meta'],
    queryFn: loadSpeechMeta,
    enabled: activeGroupId !== null,
    staleTime: Infinity,
  })
  const filtered = useMemo(() => {
    if (!terms.length) return groups
    return groups.filter((group) => group.speeches.some((speech) => {
      const title = memberSpeechGroupTitle(group, locale === 'en' ? 'Speech' : 'Rede')
      const body = texts.data?.[speech.id] ?? speech.excerpt
      const hay = `${title} ${group.agendaItem ?? ''} ${speech.speakerName} ${body}`.toLowerCase()
      return terms.every((term) => hay.includes(term))
    }))
  }, [groups, locale, terms, texts.data])
  const activeGroup = activeGroupId ? groups.find((group) => group.id === activeGroupId) ?? null : null
  const setQuery = (value: string) => {
    setQueryState(value)
    setVisibleCount(BATCH_SIZE)
  }
  return {
    query,
    setQuery,
    terms,
    texts: texts.data,
    textsLoading: terms.length > 0 && !speechTextsLoaded(locale),
    slice: filtered.slice(0, visibleCount),
    filteredCount: filtered.length,
    hasMore: visibleCount < filtered.length,
    showMore: () => setVisibleCount((value) => value + BATCH_SIZE),
    previewFor: (group: MemberSpeechGroup) => {
      const matched = terms.length
        ? group.speeches.find((speech) => {
          const title = memberSpeechGroupTitle(group, locale === 'en' ? 'Speech' : 'Rede')
          const body = texts.data?.[speech.id] ?? speech.excerpt
          return terms.every((term) => `${title} ${group.agendaItem ?? ''} ${speech.speakerName} ${body}`.toLowerCase().includes(term))
        })
        : null
      const body = matched ? texts.data?.[matched.id] ?? matched.excerpt : group.main.excerpt
      return { body, snippet: terms.length ? makeSnippet(body, terms) : null }
    },
    activeGroup,
    activeRows: activeGroup && meta.data ? contextRowsForGroup(meta.data, activeGroup, locale) : undefined,
    activeLoading: activeGroupId !== null && meta.isLoading,
    openGroup: setActiveGroupId,
    closeGroup: () => setActiveGroupId(null),
  }
}
