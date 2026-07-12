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
    ORDER BY a.id
  `).all(CURRENT_TERM) as Array<{ id: number }>
  return rows.map((r) => r.id)
}

export function votedMembers(db: Database.Database): Array<{ id: string; lastVoteDate: string }> {
  return db.prepare(`
    SELECT m.rowid, m.id, max(v.date) AS lastVoteDate
    FROM members m
    INNER JOIN vote_members vm ON vm.member_id = m.id
    INNER JOIN votes v ON v.id = vm.vote_id
    WHERE v.term_id = ?
    GROUP BY m.rowid, m.id
    ORDER BY m.rowid
  `).all(CURRENT_TERM) as Array<{ id: string; lastVoteDate: string }>
}

export function partySlugs(db: Database.Database): string[] {
  const rows = db.prepare(`
    SELECT DISTINCT s.party FROM vote_party_summaries s
    INNER JOIN votes v ON v.id = s.vote_id
    WHERE v.term_id = ? AND v.vote_type = 'namentlich'
  `).all(CURRENT_TERM) as Array<{ party: string }>
  return rows.flatMap((r) => PARTY_SLUG[r.party] ?? [])
}
