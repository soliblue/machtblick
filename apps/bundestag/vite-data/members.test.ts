import assert from 'node:assert/strict'
import test from 'node:test'
import Database from 'better-sqlite3'
import { leanMembers, type MemberBuildData } from './members'

test('lean members expose resolved portrait URLs', () => {
  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE members (id TEXT PRIMARY KEY, name TEXT NOT NULL, picture_url TEXT, mandate_type TEXT);
    CREATE TABLE votes (id TEXT PRIMARY KEY, date TEXT NOT NULL, term_id INTEGER NOT NULL, procedural INTEGER NOT NULL);
    CREATE TABLE vote_members (vote_id TEXT NOT NULL, member_id TEXT NOT NULL, state TEXT NOT NULL, choice TEXT NOT NULL);
    CREATE TABLE member_affiliations (member_id TEXT NOT NULL, party TEXT NOT NULL, term_id INTEGER NOT NULL, valid_from TEXT, valid_to TEXT);
    CREATE TABLE member_abgeordnetenwatch (member_id TEXT PRIMARY KEY, raw_json TEXT NOT NULL);
    INSERT INTO members VALUES ('test-local-member', 'Local Member', 'https://example.com/local.png', 'liste');
    INSERT INTO members VALUES ('test-remote-member', 'Remote Member', 'https://example.com/remote.png', 'direkt');
    INSERT INTO members VALUES ('test-member-without-photo', 'Member Without Photo', NULL, 'liste');
    INSERT INTO votes VALUES ('vote', '2026-01-01', 21, 0);
    INSERT INTO vote_members VALUES ('vote', 'test-local-member', 'Nordrhein-Westfalen', 'ja');
    INSERT INTO vote_members VALUES ('vote', 'test-remote-member', 'Berlin', 'ja');
    INSERT INTO vote_members VALUES ('vote', 'test-member-without-photo', 'Hamburg', 'ja');
    INSERT INTO member_affiliations VALUES ('test-local-member', 'SPD', 21, '2025-01-01', NULL);
    INSERT INTO member_affiliations VALUES ('test-remote-member', 'SPD', 21, '2025-01-01', NULL);
    INSERT INTO member_affiliations VALUES ('test-member-without-photo', 'SPD', 21, '2025-01-01', NULL);
    INSERT INTO member_abgeordnetenwatch VALUES ('test-local-member', '{}');
    INSERT INTO member_abgeordnetenwatch VALUES ('test-remote-member', '{}');
    INSERT INTO member_abgeordnetenwatch VALUES ('test-member-without-photo', '{}');
  `)
  const data: MemberBuildData = {
    majorityByVoteParty: new Map(),
    summariesByVote: new Map(),
    translations: { votes: new Map(), speeches: new Map(), partySummaries: new Map(), motions: new Map() },
  }

  const members = leanMembers(db, data, {
    'test-local-member': { file: '/members-photos/test-local-member.jpg' },
  })

  assert.equal(members.find(({ id }) => id === 'test-local-member')?.pictureUrl, '/members-photos/test-local-member.jpg')
  assert.equal(members.find(({ id }) => id === 'test-remote-member')?.pictureUrl, 'https://example.com/remote.png')
  assert.equal(members.find(({ id }) => id === 'test-member-without-photo')?.pictureUrl, null)
  db.close()
})
