import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import Database from 'better-sqlite3'

test('rechecks partial descriptions and skips title-derived rows without a source', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'machtblick-description-test-'))
  const dbPath = join(directory, 'machtblick.sqlite')
  const db = new Database(dbPath)
  db.exec(`
    CREATE TABLE votes (
      id text PRIMARY KEY,
      title text NOT NULL,
      document text,
      procedural integer NOT NULL,
      term_id integer NOT NULL,
      vote_type text NOT NULL,
      summary_simplified text,
      summary_detail text
    );
    CREATE TABLE vote_documents (vote_id text, label text, title text, url text);
    CREATE TABLE antraege (id integer PRIMARY KEY, wahlperiode integer, drucksache text, drucksache_pdf_url text, type text);
    CREATE TABLE vote_antraege (vote_id text, antrag_id integer);
    CREATE TABLE vote_description_decisions (
      vote_id text PRIMARY KEY,
      drucksache_id text,
      source_pdf_url text,
      model text,
      model_reasoning_effort text,
      generated_at text,
      prompt_version integer
    );
    INSERT INTO votes VALUES
      ('partial', 'Title-derived summary', '21/1', 0, 21, 'handzeichen', 'One line', NULL),
      ('complete', 'Complete summary', '21/2', 0, 21, 'handzeichen', 'Simple', 'Detail'),
      ('procedural', 'Procedural summary', '21/3', 1, 21, 'handzeichen', 'One line', NULL);
  `)
  db.close()

  const result = spawnSync(process.execPath, ['etl/bundestag/descriptions/run.mjs'], {
    cwd: new URL('../../..', import.meta.url),
    env: { ...process.env, MACHTBLICK_DB: dbPath },
    encoding: 'utf8',
  })

  await rm(directory, { recursive: true })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /descriptions: 1\/1 candidates/)
  assert.match(result.stdout, /skipped_no_pdf=1/)
})
