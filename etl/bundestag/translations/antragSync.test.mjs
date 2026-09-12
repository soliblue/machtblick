import assert from 'node:assert/strict'
import test from 'node:test'
import Database from 'better-sqlite3'
import { matchingAntragDescription } from './antragSync.mjs'

test('syncs only a motion description matching the translated vote source', () => {
  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE antraege (id integer PRIMARY KEY, wahlperiode integer, drucksache text);
    CREATE TABLE vote_description_decisions (vote_id text, drucksache_id text);
    CREATE TABLE antrag_descriptions (antrag_id integer, summary_simplified text, summary_detail text);
    INSERT INTO antraege VALUES (1, 21, '21/1');
    INSERT INTO vote_description_decisions VALUES ('vote-1', '21/1');
    INSERT INTO antrag_descriptions VALUES (1, 'current simple', 'current detail');
  `)

  assert.equal(matchingAntragDescription(db, 'vote-1', 'old simple', 'old detail'), null)
  assert.deepEqual(matchingAntragDescription(db, 'vote-1', 'current simple', 'current detail'), {
    id: 1,
    drucksache: '21/1',
    summary_simplified: 'current simple',
    summary_detail: 'current detail',
  })
  db.close()
})
