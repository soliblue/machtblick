import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { tokenize } from '@/lib/highlight'
import { loadSpeechMeta, loadSpeechTexts, speechTextsLoaded } from '@/lib/speechesStatic'
import type { Locale } from '@/lib/locale'
import type { SpeechResult } from '@/server/speeches'
import { contextRowsForGroup, groupMemberSpeeches, type MemberSpeechGroup } from './memberSpeechGroups'

const PAGE_SIZE = 5

export function useMemberSpeeches(speeches: SpeechResult[], locale: Locale) {
  const [query, setQueryState] = useState('')
  const [page, setPage] = useState(0)
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set())
  const terms = tokenize(query)
  const groups = useMemo(() => groupMemberSpeeches(speeches), [speeches])
  const texts = useQuery({
    queryKey: ['speech-texts', locale],
    queryFn: () => loadSpeechTexts(locale),
    enabled: terms.length > 0 || openIds.size > 0,
    staleTime: Infinity,
  })
  const meta = useQuery({
    queryKey: ['speech-meta'],
    queryFn: loadSpeechMeta,
    enabled: openIds.size > 0,
    staleTime: Infinity,
  })
  const filtered = useMemo(() => {
    if (!terms.length) return groups
    return groups.filter((group) => group.speeches.some((speech) => {
      const body = texts.data?.[speech.id] ?? speech.excerpt
      const hay = `${speech.speakerName} ${body}`.toLowerCase()
      return terms.every((term) => hay.includes(term))
    }))
  }, [groups, terms, texts.data])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const setQuery = (value: string) => {
    setQueryState(value)
    setPage(0)
  }
  const toggleOpen = (id: string) => {
    setOpenIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  return {
    query,
    setQuery,
    terms,
    texts: texts.data,
    textsLoading: terms.length > 0 && !speechTextsLoaded(locale),
    slice: filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    filteredCount: filtered.length,
    pageCount,
    safePage,
    setPage,
    openIds,
    toggleOpen,
    contextRowsFor: (group: MemberSpeechGroup) => meta.data ? contextRowsForGroup(meta.data, group) : undefined,
    contextLoading: meta.isLoading,
  }
}
