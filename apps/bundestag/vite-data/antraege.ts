import type Database from 'better-sqlite3'
import { requireVoteCleanTitle } from '../src/lib/voteTitles'
import { resolvePictureUrl } from '../src/server/photoManifest'
import {
  motionTranslation,
  voteTranslation,
  type StaticLocale,
  type StaticTranslations,
} from './translations'

type AntragRow = {
  id: number
  type: 'antrag' | 'gesetzentwurf'
  title: string
  clean_title: string | null
  abstract: string | null
  beratungsstand: string | null
  initiative_fraktion: string | null
  introduced_date: string | null
  drucksache: string | null
  drucksache_pdf_url: string | null
  sachgebiet: string | null
  deskriptor: string | null
  summary_simplified: string | null
  summary_detail: string | null
}

type SignatoryRow = {
  member_id: string
  first_name: string
  last_name: string
  picture_url: string | null
}

type VoteRow = {
  id: string
  date: string
  title: string
  clean_title: string | null
  result: 'angenommen' | 'abgelehnt'
  vote_type: string
  yes: number | null
  no: number | null
  abstain: number | null
  absent: number | null
  total_members: number | null
}

const CURRENT_TERM = 21

function parseJson<T>(value: string | null, fallback: T): T {
  return value ? JSON.parse(value) as T : fallback
}

export function leanMotions(db: Database.Database, locale: StaticLocale, translations: StaticTranslations) {
  const rows = db.prepare(`
    SELECT a.id, a.type, a.title, a.clean_title, a.drucksache, a.initiative_fraktion, a.introduced_date, a.beratungsstand
    FROM antraege a
    INNER JOIN antrag_descriptions ad ON ad.antrag_id = a.id
    WHERE a.wahlperiode = ${CURRENT_TERM}
    ORDER BY a.introduced_date DESC, a.id DESC
  `).all() as Array<{
    id: number
    type: 'antrag' | 'gesetzentwurf'
    title: string
    clean_title: string | null
    drucksache: string | null
    initiative_fraktion: string | null
    introduced_date: string | null
    beratungsstand: string | null
  }>
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: motionTranslation(translations, locale, row.id)?.title ?? row.title,
    cleanTitle: motionTranslation(translations, locale, row.id)?.clean_title ?? row.clean_title,
    drucksache: row.drucksache,
    initiativeFraktion: row.initiative_fraktion,
    introducedDate: row.introduced_date,
    beratungsstand: row.beratungsstand,
  }))
}

function cleanAbstract(value: string | null) {
  return value
    ?.replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim() || null
}

export function fullAntrag(
  db: Database.Database,
  id: number,
  locale: StaticLocale,
  translations: StaticTranslations,
  seats: Map<string, number>,
) {
  const row = db.prepare(`
    SELECT
      a.*,
      ad.summary_simplified AS summary_simplified,
      ad.summary_detail AS summary_detail
    FROM antraege a
    LEFT JOIN antrag_descriptions ad ON ad.antrag_id = a.id
    WHERE a.id = ?
  `).get(id) as AntragRow
  const translatedMotion = motionTranslation(translations, locale, id)
  const signatories = db.prepare(`
    SELECT ans.member_id, m.first_name, m.last_name, m.picture_url
    FROM antrag_signatories ans
    INNER JOIN members m ON m.id = ans.member_id
    WHERE ans.antrag_id = ?
    ORDER BY m.last_name ASC, m.first_name ASC
  `).all(id) as SignatoryRow[]
  const linkedVotes = db.prepare(`
    SELECT v.id, v.date, v.title, v.clean_title, v.result, v.vote_type, v.yes, v.no, v.abstain, v.absent, v.total_members
    FROM vote_antraege va
    INNER JOIN votes v ON v.id = va.vote_id
    WHERE va.antrag_id = ? AND v.term_id = 21 AND v.procedural = 0 AND v.vote_type != 'hammelsprung'
    ORDER BY v.date DESC
  `).all(id) as VoteRow[]
  const handzeichenIds = linkedVotes.filter((v) => v.vote_type === 'handzeichen').map((v) => v.id)
  const positionsByVote = new Map<string, Array<{ party: string; position: 'yes' | 'no' | 'abstain' | 'mixed' }>>()
  if (handzeichenIds.length) {
    const placeholders = handzeichenIds.map(() => '?').join(', ')
    for (const p of db.prepare(`SELECT vote_id, party, position FROM vote_party_summaries WHERE vote_id IN (${placeholders})`)
      .all(...handzeichenIds) as Array<{ vote_id: string; party: string; position: 'yes' | 'no' | 'abstain' | 'mixed' }>) {
      const arr = positionsByVote.get(p.vote_id) ?? []
      arr.push({ party: p.party, position: p.position })
      positionsByVote.set(p.vote_id, arr)
    }
  }
  function voteCounts(v: VoteRow) {
    if (v.vote_type === 'namentlich') {
      return { yes: v.yes ?? 0, no: v.no ?? 0, abstain: v.abstain ?? 0, absent: v.absent ?? 0, totalMembers: v.total_members ?? 0 }
    }
    let yes = 0, no = 0, abstain = 0
    for (const p of positionsByVote.get(v.id) ?? []) {
      const s = seats.get(p.party) ?? 0
      if (p.position === 'yes') yes += s
      else if (p.position === 'no') no += s
      else if (p.position === 'abstain') abstain += s
    }
    return { yes, no, abstain, absent: 0, totalMembers: yes + no + abstain }
  }
  return {
    antrag: {
      id: row.id,
      type: row.type,
      title: translatedMotion?.title ?? row.title,
      cleanTitle: translatedMotion?.clean_title ?? row.clean_title,
      abstract: cleanAbstract(row.abstract),
      beratungsstand: row.beratungsstand,
      initiativeFraktion: row.initiative_fraktion,
      introducedDate: row.introduced_date,
      drucksache: row.drucksache,
      drucksachePdfUrl: row.drucksache_pdf_url,
      sachgebiet: parseJson<string[]>(row.sachgebiet, []),
      deskriptor: parseJson<Array<{ name: string; typ: string }>>(row.deskriptor, []),
      summarySimplified: translatedMotion?.summary_simplified ?? row.summary_simplified,
      summaryDetail: translatedMotion?.summary_detail ?? row.summary_detail,
    },
    signatories: signatories.map((s) => ({
      memberId: s.member_id,
      displayName: `${s.first_name} ${s.last_name}`,
      portraitUrl: resolvePictureUrl(s.member_id, s.picture_url),
    })),
    linkedVotes: linkedVotes.map((v) => {
      const titled = requireVoteCleanTitle({
        id: v.id,
        title: v.title,
        cleanTitle: voteTranslation(translations, locale, v.id)?.clean_title ?? v.clean_title,
      })
      return {
        id: v.id,
        date: v.date,
        title: titled.title,
        cleanTitle: titled.cleanTitle,
        result: v.result,
        voteType: v.vote_type,
        ...voteCounts(v),
      }
    }),
  }
}
