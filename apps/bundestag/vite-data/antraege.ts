import type Database from 'better-sqlite3'
import { requireVoteCleanTitle } from '../src/lib/voteTitles'
import { resolvePictureUrl } from '../src/server/photoManifest'

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
}

const CURRENT_TERM = 21

function parseJson<T>(value: string | null, fallback: T): T {
  return value ? JSON.parse(value) as T : fallback
}

export function leanMotions(db: Database.Database) {
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
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    cleanTitle: r.clean_title,
    drucksache: r.drucksache,
    initiativeFraktion: r.initiative_fraktion,
    introducedDate: r.introduced_date,
    beratungsstand: r.beratungsstand,
  }))
}

function cleanAbstract(value: string | null) {
  return value
    ?.replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim() || null
}

export function fullAntrag(db: Database.Database, id: number, locale: 'de' | 'en' = 'de') {
  const row = db.prepare(`
    SELECT
      a.*,
      COALESCE(t.summary_simplified, ad.summary_simplified) AS summary_simplified,
      COALESCE(t.summary_detail, ad.summary_detail) AS summary_detail
    FROM antraege a
    LEFT JOIN antrag_descriptions ad ON ad.antrag_id = a.id
    LEFT JOIN antrag_description_translations t ON t.antrag_id = a.id AND t.locale = ?
    WHERE a.id = ?
  `).get(locale, id) as AntragRow
  const signatories = db.prepare(`
    SELECT ans.member_id, m.first_name, m.last_name, m.picture_url
    FROM antrag_signatories ans
    INNER JOIN members m ON m.id = ans.member_id
    WHERE ans.antrag_id = ?
    ORDER BY m.last_name ASC, m.first_name ASC
  `).all(id) as SignatoryRow[]
  const linkedVotes = db.prepare(`
    SELECT v.id, v.date, v.title, v.clean_title, v.result, v.vote_type
    FROM vote_antraege va
    INNER JOIN votes v ON v.id = va.vote_id
    WHERE va.antrag_id = ? AND v.term_id = 21 AND v.procedural = 0 AND v.vote_type != 'hammelsprung'
    ORDER BY v.date DESC
  `).all(id) as VoteRow[]
  return {
    antrag: {
      id: row.id,
      type: row.type,
      title: row.title,
      cleanTitle: row.clean_title,
      abstract: cleanAbstract(row.abstract),
      beratungsstand: row.beratungsstand,
      initiativeFraktion: row.initiative_fraktion,
      introducedDate: row.introduced_date,
      drucksache: row.drucksache,
      drucksachePdfUrl: row.drucksache_pdf_url,
      sachgebiet: parseJson<string[]>(row.sachgebiet, []),
      deskriptor: parseJson<Array<{ name: string; typ: string }>>(row.deskriptor, []),
      summarySimplified: row.summary_simplified,
      summaryDetail: row.summary_detail,
    },
    signatories: signatories.map((s) => ({
      memberId: s.member_id,
      displayName: `${s.first_name} ${s.last_name}`,
      portraitUrl: resolvePictureUrl(s.member_id, s.picture_url),
    })),
    linkedVotes: linkedVotes.map((v) => {
      const titled = requireVoteCleanTitle({ id: v.id, title: v.title, cleanTitle: v.clean_title })
      return {
        id: v.id,
        date: v.date,
        title: titled.title,
        cleanTitle: titled.cleanTitle,
        result: v.result,
        voteType: v.vote_type,
      }
    }),
  }
}
