import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import { decodeHtmlEntities } from '../etl/_shared/entities.mjs'

const db = new Database(fileURLToPath(new URL('./machtblick.sqlite', import.meta.url)))

const TARGETS: Array<[table: string, pk: string, columns: string[]]> = [
  ['votes', 'id', ['title', 'clean_title', 'summary', 'summary_simplified', 'summary_detail', 'document', 'agenda_item']],
  ['vote_documents', 'rowid', ['title']],
  ['antraege', 'id', ['title', 'abstract']],
  ['vote_translations', 'rowid', ['title', 'clean_title', 'topic', 'subject', 'summary', 'summary_simplified', 'summary_detail']],
  ['vote_polarity_decisions', 'vote_id', ['original_title', 'rewritten_title']],
  ['vote_party_summaries', 'rowid', ['position_summary', 'key_points']],
  ['speeches', 'id', ['text_full', 'text_excerpt']],
]

db.transaction(() => {
  for (const [table, pk, columns] of TARGETS) {
    for (const column of columns) {
      const rows = db.prepare(`SELECT ${pk} AS pk, ${column} AS value FROM ${table} WHERE ${column} GLOB '*&*;*'`).all() as Array<{ pk: string | number; value: string }>
      const update = db.prepare(`UPDATE ${table} SET ${column} = ? WHERE ${pk} = ?`)
      let changed = 0
      for (const row of rows) {
        const decoded = decodeHtmlEntities(row.value)
        if (decoded !== row.value) changed += update.run(decoded, row.pk).changes
      }
      console.log(`${table}.${column}: ${changed} decoded (${rows.length} candidates)`)
    }
  }
})()

db.close()
