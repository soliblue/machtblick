import { createServerFn } from '@tanstack/react-start'
import { db } from '@machtblick/db/client'
import { speeches } from '@machtblick/db/schema'
import { desc, isNotNull, sql, type SQL } from 'drizzle-orm'

export type SpeechSummary = {
  id: string
  speakerName: string
  speakerMemberId: string | null
  speakerRole: string | null
  party: string | null
  date: string
  agendaItem: string | null
  agendaTitle: string | null
  debateGroupId: string | null
  contributionType: string | null
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

type SpeechRawRow = {
  id: string
  speaker_name: string
  speaker_member_id: string | null
  speaker_role: string | null
  party: string | null
  position: number
  text_excerpt: string
  date: string
  agenda_item: string | null
  agenda_title: string | null
  debate_group_id: string | null
  contribution_type: string | null
  vote_id: string | null
  vote_title: string | null
  snippet: string | null
}

type SpeechFullRow = SpeechRawRow & {
  text_full: string
}

function rawToResult(r: SpeechRawRow): SpeechResult {
  return {
    id: r.id,
    speakerName: r.speaker_name,
    speakerMemberId: r.speaker_member_id,
    speakerRole: r.speaker_role,
    party: r.party,
    position: r.position,
    excerpt: r.text_excerpt,
    date: r.date,
    agendaItem: r.agenda_item,
    agendaTitle: r.agenda_title,
    debateGroupId: r.debate_group_id,
    contributionType: r.contribution_type,
    voteId: r.vote_id,
    voteTitle: r.vote_title,
    snippet: r.snippet,
  }
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
    const row = db.get(sql`
      SELECT s.id, s.speaker_name, s.speaker_member_id, s.speaker_role, s.party,
             COALESCE(sdgs.position, s.position) AS position,
             s.text_excerpt, s.text_full, s.date, s.agenda_item,
             COALESCE(sdg.title, pai.title) AS agenda_title,
             sdgs.group_id AS debate_group_id,
             sdgs.contribution_type AS contribution_type,
             lv.vote_id AS vote_id,
             COALESCE(v.clean_title, v.title) AS vote_title,
             NULL AS snippet
      FROM speeches s
      LEFT JOIN (
        SELECT speech_id, vote_id, row_number() OVER (
          PARTITION BY speech_id
          ORDER BY confidence DESC, CASE source WHEN 'direct' THEN 0 ELSE 1 END, vote_id
        ) AS rn
        FROM speech_vote_links
      ) lv ON lv.speech_id = s.id AND lv.rn = 1
      LEFT JOIN votes v ON v.id = lv.vote_id
      LEFT JOIN speech_debate_group_speeches sdgs ON sdgs.speech_id = s.id
      LEFT JOIN speech_debate_groups sdg ON sdg.id = sdgs.group_id
      LEFT JOIN plenary_agenda_items pai ON pai.session_id = s.session_id AND pai.date = s.date AND pai.agenda_item = s.agenda_item
      WHERE s.id = ${speechId}
    `) as SpeechFullRow | undefined
    if (!row) throw new Error(`speech not found: ${speechId}`)
    return { ...rawToResult(row), text: row.text_full }
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

    const partiesRows = db
      .selectDistinct({ party: speeches.party })
      .from(speeches)
      .all()
      .map((r) => r.party)
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
    if (party) filters.push(sql`s.party = ${party}`)
    if (date) filters.push(sql`s.date = ${date}`)
    if (memberId) filters.push(sql`s.speaker_member_id = ${memberId}`)
    const whereSql = filters.length ? sql`WHERE ${sql.join(filters, sql` AND `)}` : sql``
    const ftsJoin = q ? sql`JOIN speeches_fts f ON f.rowid = s.rowid` : sql``

    const snippetExpr = q
      ? sql`snippet(speeches_fts, 1, '<<<', '>>>', '…', 24)`
      : sql`NULL`
    const items = db.all(sql`
      WITH linked_votes AS (
        SELECT speech_id, vote_id, row_number() OVER (
          PARTITION BY speech_id
          ORDER BY confidence DESC, CASE source WHEN 'direct' THEN 0 ELSE 1 END, vote_id
        ) AS rn
        FROM speech_vote_links
      )
      SELECT s.id, s.speaker_name, s.speaker_member_id, s.speaker_role, s.party,
             COALESCE(sdgs.position, s.position) AS position,
             s.text_excerpt, s.date, s.agenda_item,
             COALESCE(sdg.title, pai.title) AS agenda_title,
             sdgs.group_id AS debate_group_id,
             sdgs.contribution_type AS contribution_type,
             lv.vote_id AS vote_id,
             COALESCE(v.clean_title, v.title) AS vote_title,
             ${snippetExpr} AS snippet
      FROM speeches s
      ${ftsJoin}
      LEFT JOIN linked_votes lv ON lv.speech_id = s.id AND lv.rn = 1
      LEFT JOIN votes v ON v.id = lv.vote_id
      LEFT JOIN speech_debate_group_speeches sdgs ON sdgs.speech_id = s.id
      LEFT JOIN speech_debate_groups sdg ON sdg.id = sdgs.group_id
      LEFT JOIN plenary_agenda_items pai ON pai.session_id = s.session_id AND pai.date = s.date AND pai.agenda_item = s.agenda_item
      ${whereSql}
      ORDER BY s.date DESC, COALESCE(sdgs.position, s.position) ASC
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
    const rows = db.all(sql`
      WITH linked_votes AS (
        SELECT speech_id, vote_id, row_number() OVER (
          PARTITION BY speech_id
          ORDER BY confidence DESC, CASE source WHEN 'direct' THEN 0 ELSE 1 END, vote_id
        ) AS rn
        FROM speech_vote_links
      )
      SELECT s.id, s.speaker_name, s.speaker_member_id, s.speaker_role, s.party,
             COALESCE(sdgs.position, s.position) AS position,
             s.text_excerpt, s.date, s.agenda_item,
             COALESCE(sdg.title, pai.title) AS agenda_title,
             sdgs.group_id AS debate_group_id,
             sdgs.contribution_type AS contribution_type,
             lv.vote_id AS vote_id,
             COALESCE(v.clean_title, v.title) AS vote_title,
             NULL AS snippet
      FROM speeches s
      LEFT JOIN linked_votes lv ON lv.speech_id = s.id AND lv.rn = 1
      LEFT JOIN votes v ON v.id = lv.vote_id
      LEFT JOIN speech_debate_group_speeches sdgs ON sdgs.speech_id = s.id
      LEFT JOIN speech_debate_groups sdg ON sdg.id = sdgs.group_id
      LEFT JOIN plenary_agenda_items pai ON pai.session_id = s.session_id AND pai.date = s.date AND pai.agenda_item = s.agenda_item
      WHERE s.speaker_member_id = ${memberId}
      ORDER BY s.date DESC, COALESCE(sdgs.position, s.position) ASC
    `) as Array<SpeechRawRow>
    return rows.map(rawToResult)
  })
