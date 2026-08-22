import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import type { Locale } from '../src/lib/locale'
import { PARTY_SLUG } from '../src/lib/parties'
import { CURRENT_TERM } from '../src/server/term'

export function openDb() {
  return new Database(fileURLToPath(new URL('../../../db/machtblick.sqlite', import.meta.url)), { readonly: true })
}

export function publishableVotes(db: Database.Database): Array<{ id: string; date: string }> {
  return db.prepare("SELECT id, date FROM votes WHERE term_id = ? AND procedural = 0 AND vote_type != 'hammelsprung'").all(CURRENT_TERM) as Array<{ id: string; date: string }>
}

export function publishableAntragIds(db: Database.Database, locale: Locale = 'de'): number[] {
  const rows = db.prepare(`
    SELECT a.id
    FROM antraege a
    INNER JOIN antrag_descriptions ad ON ad.antrag_id = a.id
    ${locale === 'en' ? "INNER JOIN antrag_description_translations t ON t.antrag_id = a.id AND t.locale = 'en'" : ''}
    WHERE a.wahlperiode = ?
      AND (a.abstract IS NOT NULL OR ad.summary_simplified IS NOT NULL OR a.drucksache_pdf_url IS NOT NULL)
    ORDER BY a.id
  `).all(CURRENT_TERM) as Array<{ id: number }>
  return rows.map((r) => r.id)
}

export function publishableMembers(db: Database.Database): Array<{ id: string; lastModified: string }> {
  return db.prepare(`
    WITH member_votes AS (
      SELECT vm.member_id, max(v.date) AS last_vote_date
      FROM vote_members vm
      INNER JOIN votes v ON v.id = vm.vote_id
      WHERE v.term_id = ?
      GROUP BY vm.member_id
    ), current_members AS (
      SELECT member_id, max(valid_from) AS valid_from
      FROM member_affiliations
      WHERE term_id = ? AND valid_to IS NULL
      GROUP BY member_id
    )
    SELECT m.id,
           CASE
             WHEN mv.last_vote_date IS NULL THEN cm.valid_from
             WHEN cm.valid_from IS NULL THEN mv.last_vote_date
             ELSE max(mv.last_vote_date, cm.valid_from)
           END AS lastModified
    FROM members m
    LEFT JOIN member_votes mv ON mv.member_id = m.id
    LEFT JOIN current_members cm ON cm.member_id = m.id
    WHERE mv.member_id IS NOT NULL OR cm.member_id IS NOT NULL
    ORDER BY m.rowid
  `).all(CURRENT_TERM, CURRENT_TERM) as Array<{ id: string; lastModified: string }>
}

export function partySlugs(db: Database.Database): string[] {
  const rows = db.prepare(`
    SELECT DISTINCT s.party FROM vote_party_summaries s
    INNER JOIN votes v ON v.id = s.vote_id
    WHERE v.term_id = ? AND v.vote_type = 'namentlich'
  `).all(CURRENT_TERM) as Array<{ party: string }>
  return rows.flatMap((r) => PARTY_SLUG[r.party] ?? [])
}
