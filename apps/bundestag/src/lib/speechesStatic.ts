import type {
  MemberOption,
  SpeechResult,
  SpeechSearchParams,
  SpeechSearchResponse,
} from '@/server/speeches'
import { makeSnippet } from './snippet'
import type { Locale } from './locale'

export type SpeechMetaEntry = Omit<SpeechResult, 'snippet'>

const PAGE_SIZE = 5

let metaCache: Promise<SpeechMetaEntry[]> | null = null
let textCache: Partial<Record<Locale, Promise<Record<string, string>>>> = {}
let textsResolved: Partial<Record<Locale, boolean>> = {}

export function loadSpeechMeta(): Promise<SpeechMetaEntry[]> {
  metaCache ??= fetchJson<SpeechMetaEntry[]>('/speeches-meta.json')
  return metaCache
}

const SHARD_COUNT = 4

export function loadSpeechTexts(locale: Locale = 'de'): Promise<Record<string, string>> {
  textCache[locale] ??= Promise.all(
    Array.from({ length: SHARD_COUNT }, (_, i) => fetchJson<Record<string, string>>(speechShardPath(locale, i))),
  ).then((parts) => {
    const merged: Record<string, string> = {}
    for (const p of parts) Object.assign(merged, p)
    textsResolved[locale] = true
    return merged
  })
  return textCache[locale]
}

export function speechTextsLoaded(locale: Locale = 'de'): boolean {
  return textsResolved[locale] === true
}

function speechShardPath(locale: Locale, shard: number): string {
  return locale === 'en' ? `/speeches-search-en-${shard}.json` : `/speeches-search-${shard}.json`
}

async function fetchJson<T>(path: string): Promise<T> {
  if (typeof window === 'undefined') {
    const fs = await import(/* @vite-ignore */ 'node' + ':fs/promises')
    const url = await import(/* @vite-ignore */ 'node' + ':url')
    const buf = await fs.readFile(url.fileURLToPath(new URL('public' + path, 'file://' + process.cwd() + '/')), 'utf8')
    return JSON.parse(buf) as T
  }
  const res = await fetch(path)
  return (await res.json()) as T
}

function tokens(q: string): string[] {
  return q.trim().toLowerCase().split(/\s+/).filter(Boolean)
}

function matches(speakerName: string, body: string, terms: string[]): boolean {
  if (!terms.length) return true
  const hay = `${speakerName} ${body}`.toLowerCase()
  return terms.every((t) => hay.includes(t))
}

export async function searchSpeechesStatic(params: SpeechSearchParams, locale: Locale = 'de'): Promise<SpeechSearchResponse> {
  const meta = await loadSpeechMeta()
  const q = params.q?.trim() ?? ''
  const party = params.party?.trim() ?? ''
  const date = params.date?.trim() ?? ''
  const memberId = params.memberId?.trim() ?? ''
  const page = Math.max(0, params.page ?? 0)
  const terms = tokens(q)
  const texts = terms.length || locale === 'en' ? await loadSpeechTexts(locale) : null

  const filtered = meta.filter((s) => {
    if (party && s.party !== party) return false
    if (date && s.date !== date) return false
    if (memberId && s.speakerMemberId !== memberId) return false
    const body = texts ? (texts[s.id] ?? s.excerpt) : s.excerpt
    return matches(s.speakerName, body, terms)
  })

  const parties = Array.from(new Set(meta.map((s) => s.party).filter((p): p is string => !!p))).sort()
  const dates = Array.from(new Set(meta.map((s) => s.date))).sort((a, b) => (a < b ? 1 : -1))
  const memberMap = new Map<string, string>()
  for (const s of meta) if (s.speakerMemberId) memberMap.set(s.speakerMemberId, s.speakerName)
  const membersOptions: MemberOption[] = Array.from(memberMap, ([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))

  const items: SpeechResult[] = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((s) => ({
    ...s,
    excerpt: locale === 'en' && texts ? (texts[s.id] ?? s.excerpt).slice(0, 220) : s.excerpt,
    snippet: q && texts ? makeSnippet(texts[s.id] ?? s.excerpt, terms) : null,
  }))

  return { items, total: filtered.length, parties, dates, membersOptions, pageSize: PAGE_SIZE }
}

export async function getSpeechStatic(id: string): Promise<{ text: string; date: string }> {
  const [meta, texts] = await Promise.all([loadSpeechMeta(), loadSpeechTexts()])
  const entry = meta.find((s) => s.id === id)
  const text = texts[id] ?? entry?.excerpt ?? ''
  return { text, date: entry?.date ?? '' }
}
