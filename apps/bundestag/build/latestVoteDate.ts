import { CURRENT_TERM } from '../src/server/term'
import { openDb } from './shared'

export function latestVoteDate() {
  const db = openDb()
  const latest = (db.prepare('SELECT max(date) AS d FROM votes WHERE term_id = ?').get(CURRENT_TERM) as { d: string | null }).d
  db.close()
  return latest ?? new Date().toISOString().slice(0, 10)
}
