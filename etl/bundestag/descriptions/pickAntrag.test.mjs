import assert from 'node:assert/strict'
import test from 'node:test'
import Database from 'better-sqlite3'
import { pickAntragWithFallback } from './pickAntrag.mjs'

test('prefers a pinned Drucksache over a linked host bill', async () => {
  const db = new Database(':memory:')
  const voteId = 'pp21-90-14-anderungsantrag-zum-abgeordnetengesetz-2026'
  db.exec(`
    CREATE TABLE votes (id text PRIMARY KEY, document text, vote_type text);
    CREATE TABLE vote_documents (vote_id text, label text, title text, url text);
    CREATE TABLE antraege (
      id integer PRIMARY KEY,
      wahlperiode integer,
      drucksache text,
      drucksache_pdf_url text,
      type text
    );
    CREATE TABLE vote_antraege (vote_id text, antrag_id integer);
    INSERT INTO votes VALUES ('${voteId}', 'Änderungsantrag der Fraktion der AfD (Drucksache 21/6851, 21/6330, 21/7031)', 'handzeichen');
    INSERT INTO antraege VALUES (1, 21, '21/6330', 'https://example.test/6330.pdf', 'gesetzentwurf');
    INSERT INTO antraege VALUES (2, 21, '21/7031', 'https://example.test/7031.pdf', 'änderungsantrag');
    INSERT INTO vote_antraege VALUES ('${voteId}', 1);
  `)

  assert.deepEqual(await pickAntragWithFallback(voteId, db), {
    drucksacheId: '21/7031',
    pdfUrl: 'https://example.test/7031.pdf',
    kind: 'antrag',
  })
  db.close()
})

test('keeps linked source precedence for unpinned hand votes', async () => {
  const db = new Database(':memory:')
  const voteId = 'pp21-31-0-anderungsantrag-b90-grune-zum-gesetzentwurf-zur-beschleunigung-des-wohnungsbaus'
  db.exec(`
    CREATE TABLE votes (id text PRIMARY KEY, document text, vote_type text);
    CREATE TABLE vote_documents (vote_id text, label text, title text, url text);
    CREATE TABLE antraege (
      id integer PRIMARY KEY,
      wahlperiode integer,
      drucksache text,
      drucksache_pdf_url text,
      type text
    );
    CREATE TABLE vote_antraege (vote_id text, antrag_id integer);
    INSERT INTO votes VALUES ('${voteId}', 'Drucksache 21/2111, 21/2109, 21/781', 'handzeichen');
    INSERT INTO antraege VALUES (1, 21, '21/2111', 'https://example.test/2111.pdf', 'änderungsantrag');
    INSERT INTO antraege VALUES (2, 21, '21/781', 'https://example.test/781.pdf', 'gesetzentwurf');
    INSERT INTO vote_antraege VALUES ('${voteId}', 1);
  `)

  assert.deepEqual(await pickAntragWithFallback(voteId, db), {
    drucksacheId: '21/2111',
    pdfUrl: 'https://example.test/2111.pdf',
    kind: 'antrag',
  })
  db.close()
})
