import type { SpeechResult } from '@/server/speeches'
import type { SpeechMetaEntry } from '@/lib/speechesStatic'

export type MemberSpeechGroup = {
  id: string
  date: string
  agendaItem: string | null
  agendaTitle: string | null
  voteId: string | null
  voteTitle: string | null
  speeches: SpeechResult[]
  main: SpeechResult
  shortCount: number
}

export function groupMemberSpeeches(speeches: SpeechResult[]): MemberSpeechGroup[] {
  const byKey = new Map<string, SpeechResult[]>()
  for (const speech of speeches) {
    const key = speechGroupKey(speech)
    const rows = byKey.get(key) ?? []
    rows.push(speech)
    byKey.set(key, rows)
  }
  return Array.from(byKey, ([id, rows]) => {
    const sorted = rows.slice().sort((a, b) => a.position - b.position)
    const main = sorted.reduce((best, speech) => speech.excerpt.length > best.excerpt.length ? speech : best, sorted[0])
    const linked = sorted.find((speech) => speech.voteId) ?? main
    return {
      id,
      date: main.date,
      agendaItem: main.agendaItem,
      agendaTitle: main.agendaTitle,
      voteId: linked.voteId,
      voteTitle: linked.voteTitle,
      speeches: sorted,
      main,
      shortCount: sorted.filter((speech) => speech.excerpt.split(/\s+/).filter(Boolean).length < 24).length,
    }
  }).sort((a, b) => b.date.localeCompare(a.date) || a.main.position - b.main.position)
}

export function contextRowsForGroup(meta: SpeechMetaEntry[], group: MemberSpeechGroup): SpeechMetaEntry[] {
  const rows = meta
    .filter((speech) => speechGroupKey(speech) === group.id)
    .sort((a, b) => a.position - b.position)
  const memberIds = new Set(group.speeches.map((speech) => speech.id))
  const keep = new Set<string>()
  for (let i = 0; i < rows.length; i++) {
    if (memberIds.has(rows[i].id)) {
      if (rows[i - 1]) keep.add(rows[i - 1].id)
      keep.add(rows[i].id)
      if (rows[i + 1]) keep.add(rows[i + 1].id)
    }
  }
  return rows.filter((speech) => keep.has(speech.id))
}

export function speechGroupKey(speech: Pick<SpeechResult, 'date' | 'agendaItem' | 'voteId' | 'id'>) {
  return `${speech.date}\u0000${speech.agendaItem ?? speech.voteId ?? speech.id}`
}
