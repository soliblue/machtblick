import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'

const db = new Database(fileURLToPath(new URL('./machtblick.sqlite', import.meta.url)))

const changed = db.prepare(`
  UPDATE members SET name = trim(first_name) || ' ' || trim(last_name)
  WHERE trim(first_name) != '' AND trim(last_name) != ''
    AND name != trim(first_name) || ' ' || trim(last_name)
`).run().changes

console.log(`normalized ${changed} member names to "First Last"`)
db.close()
