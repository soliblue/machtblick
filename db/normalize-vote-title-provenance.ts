import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import { readHandzeichenTitleSources } from './handzeichen-title-sources'

const db = new Database(fileURLToPath(new URL('./machtblick.sqlite', import.meta.url)))
const fillCleanTitleFallbacks = process.argv.includes('--fill-clean-title-fallbacks')

const restoreRows = db.prepare(`
  SELECT v.id, p.original_title AS originalTitle
  FROM votes v
  INNER JOIN vote_polarity_decisions p ON p.vote_id = v.id
  WHERE p.inverted = 1
    AND p.original_title IS NOT NULL
    AND trim(p.original_title) != ''
    AND p.rewritten_title IS NOT NULL
    AND v.title = p.rewritten_title
    AND p.original_title != p.rewritten_title
`).all() as Array<{ id: string; originalTitle: string }>

const restoreTitle = db.prepare('UPDATE votes SET title = ? WHERE id = ?')
for (const row of restoreRows) restoreTitle.run(row.originalTitle, row.id)

const handzeichenTitleSources = readHandzeichenTitleSources()
const handzeichenTitleRows = db.prepare(`
  SELECT id, title
  FROM votes
  WHERE term_id = 21
    AND vote_type = 'handzeichen'
`).all() as Array<{ id: string; title: string }>

let restoredHandzeichenTitles = 0
for (const row of handzeichenTitleRows) {
  const sourceTitle = handzeichenTitleSources.get(row.id)
  if (sourceTitle && sourceTitle !== row.title) {
    restoreTitle.run(sourceTitle, row.id)
    restoredHandzeichenTitles++
  }
}

const sourceRows = db.prepare(`
  SELECT id, bundestag_id AS bundestagId
  FROM votes
  WHERE term_id = 21
    AND vote_type = 'namentlich'
    AND bundestag_id IS NOT NULL
    AND source_url != 'https://www.bundestag.de/parlament/plenum/abstimmung/abstimmung?id=' || bundestag_id
`).all() as Array<{ id: string; bundestagId: number }>

const updateSourceUrl = db.prepare('UPDATE votes SET source_url = ? WHERE id = ?')
for (const row of sourceRows) {
  updateSourceUrl.run(`https://www.bundestag.de/parlament/plenum/abstimmung/abstimmung?id=${row.bundestagId}`, row.id)
}

let cleanTitleFallbacks = 0
if (fillCleanTitleFallbacks) {
  const cleanRows = db.prepare(`
    SELECT v.id, v.title, v.inverted, p.rewritten_title AS rewrittenTitle
    FROM votes v
    LEFT JOIN vote_polarity_decisions p ON p.vote_id = v.id
    WHERE v.term_id = 21
      AND v.procedural = 0
      AND v.vote_type != 'hammelsprung'
      AND (v.clean_title IS NULL OR trim(v.clean_title) = '')
  `).all() as Array<{ id: string; title: string; inverted: number; rewrittenTitle: string | null }>
  const updateCleanTitle = db.prepare('UPDATE votes SET clean_title = ? WHERE id = ?')
  for (const row of cleanRows) {
    updateCleanTitle.run(row.inverted && row.rewrittenTitle ? row.rewrittenTitle : row.title, row.id)
    cleanTitleFallbacks++
  }
}

console.log(`vote title provenance: restored_titles=${restoreRows.length} restored_handzeichen_titles=${restoredHandzeichenTitles} source_urls=${sourceRows.length} clean_title_fallbacks=${cleanTitleFallbacks}`)
db.close()
