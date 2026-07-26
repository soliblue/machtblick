import { readFileSync } from 'node:fs'
import { openBerlinDb } from './client.ts'

const db = openBerlinDb({ readonly: false, fileMustExist: false })
db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'))
if (!(db.prepare("SELECT 1 FROM pragma_table_info('programme_documents') WHERE name = 'embeddable'").get())) {
  db.exec('ALTER TABLE programme_documents ADD COLUMN embeddable INTEGER NOT NULL DEFAULT 1')
}
if (!(db.prepare("SELECT 1 FROM pragma_table_info('candidate_portraits') WHERE name = 'license_url'").get())) {
  db.exec('ALTER TABLE candidate_portraits ADD COLUMN license_url TEXT')
}
db.close()
