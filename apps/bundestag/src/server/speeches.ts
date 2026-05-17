import { createServerFn } from '@tanstack/react-start'
import { db } from '@machtblick/db/client'
import { speeches, votes } from '@machtblick/db/schema'
import { asc, desc, eq, isNotNull, sql, type SQL } from 'drizzle-orm'

export type SpeechSummary = {
  id: string
  speakerName: string
  speakerMemberId: string | null
  speakerRole: string | null
  party: string | null
  date: string
  position: number
  excerpt: string
}

export type SpeechFull = SpeechSummary & {
  text: string
}

export type SpeechResult = SpeechSummary & {
  voteId: string | null
  voteTitle: string | null
  snippet: string | null
}

export type MemberOption = { id: string; name: string }

export type SpeechSearchResponse = {
  items: SpeechResult[]
  total: number
  parties: string[]
  dates: string[]
  membersOptions: MemberOption[]
  pageSize: number
}

const PARTY_NORMALIZE: Record<string, string> = {
  'BÜNDNIS 90/DIE GRÜNEN': 'B90/Grüne',
  'DIE LINKE': 'Die Linke',
}

function normalizeParty(raw: string | null): string | null {
  return raw ? (PARTY_NORMALIZE[raw] ?? raw) : null
}

function toSummary(row: typeof speeches.$inferSelect): SpeechSummary {
  return {
    id: row.id,
    speakerName: row.speakerName,
    speakerMemberId: row.speakerMemberId,
    speakerRole: row.speakerRole,
    party: normalizeParty(row.party),
    date: row.date,
    position: row.position,
    excerpt: row.textExcerpt,
  }
}

function toResult(row: typeof speeches.$inferSelect, voteTitle: string | null = null): SpeechResult {
  return { ...toSummary(row), date: row.date, voteId: row.voteId, voteTitle, snippet: null }
}

type SpeechRawRow = {
  id: string
  speaker_name: string
  speaker_member_id: string | null
  speaker_role: string | null
  party: string | null
  position: number
  text_excerpt: string
  date: string
  vote_id: string | null
  vote_title: string | null
  snippet: string | null
}

function rawToResult(r: SpeechRawRow): SpeechResult {
  return {
    id: r.id,
    speakerName: r.speaker_name,
    speakerMemberId: r.speaker_member_id,
    speakerRole: r.speaker_role,
    party: normalizeParty(r.party),
    position: r.position,
    excerpt: r.text_excerpt,
    date: r.date,
    voteId: r.vote_id,
    voteTitle: r.vote_title,
    snippet: r.snippet,
  }
}

const PARTY_DENORMALIZE: Record<string, string[]> = {
  'B90/Grüne': ['B90/Grüne', 'BÜNDNIS 90/DIE GRÜNEN'],
  'Die Linke': ['Die Linke', 'DIE LINKE'],
}

function partyMatchValues(party: string): string[] {
  return PARTY_DENORMALIZE[party] ?? [party]
}

function escapeFts(q: string): string {
  return q
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => `"${t.replace(/"/g, '""')}"*`)
    .join(' ')
}

export const getSpeech = createServerFn({ method: 'GET' })
  .inputValidator((speechId: string) => speechId)
  .handler(async ({ data: speechId }): Promise<SpeechFull> => {
    const row = db.select().from(speeches).where(eq(speeches.id, speechId)).get()
    if (!row) throw new Error(`speech not found: ${speechId}`)
    return { ...toSummary(row), text: row.textFull, date: row.date }
  })

export type SpeechSearchParams = {
  q?: string
  party?: string
  date?: string
  memberId?: string
  page?: number
}

const PAGE_SIZE = 5

export const searchSpeeches = createServerFn({ method: 'GET' })
  .inputValidator((params: SpeechSearchParams) => params)
  .handler(async ({ data }): Promise<SpeechSearchResponse> => {
    const q = data.q?.trim() ?? ''
    const party = data.party?.trim() ?? ''
    const date = data.date?.trim() ?? ''
    const memberId = data.memberId?.trim() ?? ''
    const page = Math.max(0, data.page ?? 0)
    const offset = page * PAGE_SIZE

    const partyValues = party ? partyMatchValues(party) : null

    const partiesRows = db
      .selectDistinct({ party: speeches.party })
      .from(speeches)
      .all()
      .map((r) => normalizeParty(r.party))
      .filter((p): p is string => !!p)
    const parties = Array.from(new Set(partiesRows)).sort()

    const dates = db
      .selectDistinct({ date: speeches.date })
      .from(speeches)
      .orderBy(desc(speeches.date))
      .all()
      .map((r) => r.date)

    const membersOptions = db
      .selectDistinct({ id: speeches.speakerMemberId, name: speeches.speakerName })
      .from(speeches)
      .where(isNotNull(speeches.speakerMemberId))
      .all()
      .filter((r): r is MemberOption => !!r.id)
      .sort((a, b) => a.name.localeCompare(b.name, 'de'))

    const filters: SQL[] = []
    if (q) filters.push(sql`f.speeches_fts MATCH ${escapeFts(q)}`)
    if (partyValues) filters.push(sql`s.party IN (${sql.join(partyValues.map((v) => sql`${v}`), sql`, `)})`)
    if (date) filters.push(sql`s.date = ${date}`)
    if (memberId) filters.push(sql`s.speaker_member_id = ${memberId}`)
    const whereSql = filters.length ? sql`WHERE ${sql.join(filters, sql` AND `)}` : sql``
    const ftsJoin = q ? sql`JOIN speeches_fts f ON f.rowid = s.rowid` : sql``

    const snippetExpr = q
      ? sql`snippet(speeches_fts, 1, '<<<', '>>>', '…', 24)`
      : sql`NULL`
    const items = db.all(sql`
      SELECT s.*, COALESCE(v.clean_title, v.title) AS vote_title, ${snippetExpr} AS snippet FROM speeches s
      ${ftsJoin}
      LEFT JOIN votes v ON v.id = s.vote_id
      ${whereSql}
      ORDER BY s.date DESC, s.position ASC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `) as Array<SpeechRawRow>
    const totalRow = db.get(sql`
      SELECT COUNT(*) AS c FROM speeches s
      ${ftsJoin}
      ${whereSql}
    `) as { c: number } | undefined

    return {
      items: items.map(rawToResult),
      total: totalRow?.c ?? 0,
      parties,
      dates,
      membersOptions,
      pageSize: PAGE_SIZE,
    }
  })

export type MemberSpeechSummary = SpeechResult

export const listSpeechesForMember = createServerFn({ method: 'GET' })
  .inputValidator((memberId: string) => memberId)
  .handler(async ({ data: memberId }): Promise<MemberSpeechSummary[]> => {
    const rows = db
      .select({ speech: speeches, voteTitle: votes.title, voteCleanTitle: votes.cleanTitle })
      .from(speeches)
      .leftJoin(votes, eq(votes.id, speeches.voteId))
      .where(eq(speeches.speakerMemberId, memberId))
      .orderBy(desc(speeches.date), asc(speeches.position))
      .all()
    return rows.map((r) => toResult(r.speech, r.voteCleanTitle ?? r.voteTitle))
  })
