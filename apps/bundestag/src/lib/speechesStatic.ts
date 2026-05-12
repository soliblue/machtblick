import type {
  MemberOption,
  SpeechResult,
  SpeechSearchParams,
  SpeechSearchResponse,
} from '@/server/speeches'

export type SpeechIndexEntry = Omit<SpeechResult, 'snippet'> & { text: string }

const PAGE_SIZE = 5
const SNIPPET_RADIUS = 24

let cache: Promise<SpeechIndexEntry[]> | null = null

export function loadSpeechIndex(): Promise<SpeechIndexEntry[]> {
  if (cache) return cache
  cache = fetchJson<SpeechIndexEntry[]>('/speeches-index.json')
  return cache
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

function matches(entry: SpeechIndexEntry, terms: string[]): boolean {
  if (!terms.length) return true
  const hay = `${entry.speakerName} ${entry.text}`.toLowerCase()
  return terms.every((t) => hay.includes(t))
}

function makeSnippet(text: string, terms: string[]): string | null {
  if (!terms.length) return null
  const lower = text.toLowerCase()
  let firstIdx = -1
  let matchLen = 0
  for (const t of terms) {
    const i = lower.indexOf(t)
    if (i >= 0 && (firstIdx < 0 || i < firstIdx)) {
      firstIdx = i
      matchLen = t.length
    }
  }
  if (firstIdx < 0) return null
  const start = Math.max(0, firstIdx - SNIPPET_RADIUS)
  const end = Math.min(text.length, firstIdx + matchLen + SNIPPET_RADIUS)
  const pre = start > 0 ? '…' : ''
  const post = end < text.length ? '…' : ''
  const before = text.slice(start, firstIdx)
  const match = text.slice(firstIdx, firstIdx + matchLen)
  const after = text.slice(firstIdx + matchLen, end)
  return `${pre}${before}<<<${match}>>>${after}${post}`
}

export async function searchSpeechesStatic(params: SpeechSearchParams): Promise<SpeechSearchResponse> {
  const index = await loadSpeechIndex()
  const q = params.q?.trim() ?? ''
  const party = params.party?.trim() ?? ''
  const date = params.date?.trim() ?? ''
  const memberId = params.memberId?.trim() ?? ''
  const page = Math.max(0, params.page ?? 0)
  const terms = tokens(q)

  const filtered = index.filter((s) => {
    if (party && s.party !== party) return false
    if (date && s.date !== date) return false
    if (memberId && s.speakerMemberId !== memberId) return false
    return matches(s, terms)
  })

  const parties = Array.from(new Set(index.map((s) => s.party).filter((p): p is string => !!p))).sort()
  const dates = Array.from(new Set(index.map((s) => s.date))).sort((a, b) => (a < b ? 1 : -1))
  const memberMap = new Map<string, string>()
  for (const s of index) if (s.speakerMemberId) memberMap.set(s.speakerMemberId, s.speakerName)
  const membersOptions: MemberOption[] = Array.from(memberMap, ([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))

  const items: SpeechResult[] = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map(({ text, ...s }) => ({
    ...s,
    snippet: q ? makeSnippet(text, terms) : null,
  }))

  return { items, total: filtered.length, parties, dates, membersOptions, pageSize: PAGE_SIZE }
}

export async function getSpeechStatic(id: string): Promise<{ text: string; date: string }> {
  return fetchJson<{ text: string; date: string }>(`/speeches/${id}.json`)
}
