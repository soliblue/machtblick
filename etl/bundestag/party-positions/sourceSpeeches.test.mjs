import assert from 'node:assert/strict'
import test from 'node:test'
import Database from 'better-sqlite3'
import { clearGeneratedSummaries, shouldClearGeneratedSummary, speechSourcesChanged } from './sourceSpeeches.mjs'

test('ignores speech ordering changes', () => {
  assert.equal(speechSourcesChanged('["speech-2","speech-1"]', [{ id: 'speech-1' }, { id: 'speech-2' }]), false)
})

test('detects replaced and missing speech sources', () => {
  assert.equal(speechSourcesChanged('["pdf-speech"]', [{ id: 'xml-speech' }]), true)
  assert.equal(speechSourcesChanged(null, [{ id: 'speech-1' }]), true)
})

test('clears generated prose when changed sources become ineligible', () => {
  const generated = { vote_id: 'vote-1', party: 'fraktionslos', generated_at: '2026-07-10', source_speech_ids: '["old-speech"]' }
  assert.equal(shouldClearGeneratedSummary(generated, true, [], 0, 150), true)
  assert.equal(shouldClearGeneratedSummary(generated, true, [{ id: 'new-speech' }], 80, 150), true)
  assert.equal(shouldClearGeneratedSummary({ ...generated, generated_at: null }, true, [], 0, 150), false)
  assert.equal(shouldClearGeneratedSummary(generated, false, [{ id: 'old-speech' }], 80, 150), false)

  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE vote_party_summaries (
      vote_id text NOT NULL,
      party text NOT NULL,
      position_summary text,
      key_points text,
      dissent_note text,
      PRIMARY KEY(vote_id, party)
    );
    CREATE TABLE vote_party_summary_decisions (
      vote_id text NOT NULL,
      party text NOT NULL,
      PRIMARY KEY(vote_id, party)
    );
    CREATE TABLE vote_party_summary_translations (
      vote_id text NOT NULL,
      party text NOT NULL,
      locale text NOT NULL,
      PRIMARY KEY(vote_id, party, locale)
    );
    INSERT INTO vote_party_summaries VALUES
      ('vote-1', 'fraktionslos', 'stale summary', '- stale point', 'stale dissent'),
      ('vote-2', 'fraktionslos', 'manual summary', '- manual point', NULL);
    INSERT INTO vote_party_summary_decisions VALUES ('vote-1', 'fraktionslos');
    INSERT INTO vote_party_summary_translations VALUES ('vote-1', 'fraktionslos', 'en');
  `)

  clearGeneratedSummaries(db, [generated])

  assert.deepEqual(db.prepare('SELECT position_summary, key_points, dissent_note FROM vote_party_summaries WHERE vote_id = ?').get('vote-1'), {
    position_summary: null,
    key_points: null,
    dissent_note: null,
  })
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM vote_party_summary_decisions').get().count, 0)
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM vote_party_summary_translations').get().count, 0)
  assert.deepEqual(db.prepare('SELECT position_summary, key_points FROM vote_party_summaries WHERE vote_id = ?').get('vote-2'), {
    position_summary: 'manual summary',
    key_points: '- manual point',
  })
  db.close()
})
