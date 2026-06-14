import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'

const db = new Database(fileURLToPath(new URL('./machtblick.sqlite', import.meta.url)))

const clean = (col: string) =>
  db.prepare(`
    UPDATE votes SET ${col} = trim(replace(replace(replace(${col}, char(8212), ', '), char(8211), '-'), ' -- ', ', '))
    WHERE ${col} LIKE '%' || char(8212) || '%' OR ${col} LIKE '%' || char(8211) || '%' OR ${col} LIKE '% -- %'
  `).run().changes

for (const col of ['clean_title', 'summary_simplified', 'summary_detail']) console.log(`${col}: ${clean(col)} rows cleaned`)
db.close()
