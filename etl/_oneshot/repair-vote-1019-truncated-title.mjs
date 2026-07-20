import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

const VOTE_ID = '2026-07-10-1019-ablehnung-des-antrags-der-linken-39-krankenversicherte-entlasten-nicht'
const TRUNCATED = "Ablehnung des Antrags der Linken 'Krankenversicherte entlasten, nicht..."
const FULL = "Ablehnung des Antrags der Linken 'Krankenversicherte entlasten, nicht belasten'"
const TRUNCATED_EN = "Rejection of Die Linke motion 'Relieve people with health insurance, not..."
const FULL_EN = "Rejection of Die Linke motion 'Relieve people with health insurance, not burden them'"

const db = new Database(fileURLToPath(new URL('../../db/machtblick.sqlite', import.meta.url)))
const title = db.prepare('UPDATE votes SET title = ? WHERE id = ? AND title = ?').run(FULL, VOTE_ID, TRUNCATED).changes
const documents = db.prepare('UPDATE vote_documents SET title = ? WHERE vote_id = ? AND title = ?').run(FULL, VOTE_ID, TRUNCATED).changes
const translation = db.prepare('UPDATE vote_translations SET title = ? WHERE vote_id = ? AND title = ?').run(FULL_EN, VOTE_ID, TRUNCATED_EN).changes
db.close()

console.log(`title repairs: ${title}, vote_documents repairs: ${documents}, en translation repairs: ${translation}`)
