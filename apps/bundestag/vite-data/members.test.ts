import assert from 'node:assert/strict'
import test from 'node:test'
import Database from 'better-sqlite3'
import { publishableMembers } from '../build/shared'
import { fullMember, leanMembers, type MemberBuildData } from './members'
import { fullParty } from './parties'

test('member publication includes current zero-vote members and historical participants', () => {
  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      picture_url TEXT,
      picture_author TEXT,
      picture_license TEXT,
      picture_source_url TEXT,
      mandate_type TEXT,
      list_state TEXT,
      constituency_number TEXT,
      constituency_name TEXT
    );
    CREATE TABLE votes (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      term_id INTEGER NOT NULL,
      procedural INTEGER NOT NULL,
      vote_type TEXT NOT NULL,
      title TEXT NOT NULL,
      clean_title TEXT,
      result TEXT NOT NULL,
      initiator TEXT
    );
    CREATE TABLE vote_members (vote_id TEXT NOT NULL, member_id TEXT NOT NULL, state TEXT NOT NULL, choice TEXT NOT NULL);
    CREATE TABLE member_affiliations (member_id TEXT NOT NULL, party TEXT NOT NULL, term_id INTEGER NOT NULL, valid_from TEXT, valid_to TEXT);
    CREATE TABLE member_abgeordnetenwatch (member_id TEXT PRIMARY KEY, raw_json TEXT NOT NULL);
    CREATE TABLE vote_party_summaries (vote_id TEXT, party TEXT, members INTEGER, yes INTEGER, no INTEGER, abstain INTEGER, absent INTEGER);
    CREATE TABLE speeches (id TEXT, speaker_name TEXT, speaker_member_id TEXT, speaker_role TEXT, party TEXT, position INTEGER, text_excerpt TEXT, date TEXT, agenda_item TEXT, session_id TEXT);
    CREATE TABLE speech_vote_links (speech_id TEXT, vote_id TEXT, confidence REAL, source TEXT);
    CREATE TABLE speech_debate_group_speeches (speech_id TEXT, position INTEGER, group_id TEXT, contribution_type TEXT);
    CREATE TABLE speech_debate_groups (id TEXT, title TEXT);
    CREATE TABLE plenary_agenda_items (session_id TEXT, date TEXT, agenda_item TEXT, title TEXT);
    CREATE TABLE party_donations (id TEXT, party TEXT, donor TEXT, amount_eur REAL, date_received TEXT);
    CREATE TABLE party_lineages (id TEXT, current_party_id TEXT);
    CREATE TABLE party_lineage_members (lineage_id TEXT, party_name TEXT);
    INSERT INTO members VALUES ('test-local-member', 'Local Member', 'https://example.com/local.png', NULL, NULL, NULL, 'liste', 'Nordrhein-Westfalen', NULL, NULL);
    INSERT INTO members VALUES ('test-remote-member', 'Remote Member', 'https://example.com/remote.png', NULL, NULL, NULL, 'direkt', 'Berlin', NULL, NULL);
    INSERT INTO members VALUES ('test-member-without-photo', 'Member Without Photo', NULL, NULL, NULL, NULL, 'liste', 'Hamburg', NULL, NULL);
    INSERT INTO members VALUES ('test-current-member', 'Current Member', NULL, NULL, NULL, NULL, 'liste', 'Mecklenburg-Vorpommern', NULL, NULL);
    INSERT INTO members VALUES ('test-departed-member', 'Departed Member', NULL, NULL, NULL, NULL, 'liste', 'Bayern', NULL, NULL);
    INSERT INTO votes VALUES ('vote', '2026-01-01', 21, 0, 'namentlich', 'Test vote', 'Test vote', 'angenommen', 'SPD');
    INSERT INTO vote_members VALUES ('vote', 'test-local-member', 'Nordrhein-Westfalen', 'ja');
    INSERT INTO vote_members VALUES ('vote', 'test-remote-member', 'Berlin', 'ja');
    INSERT INTO vote_members VALUES ('vote', 'test-member-without-photo', 'Hamburg', 'ja');
    INSERT INTO vote_members VALUES ('vote', 'test-departed-member', 'Bayern', 'ja');
    INSERT INTO member_affiliations VALUES ('test-local-member', 'SPD', 21, '2025-01-01', NULL);
    INSERT INTO member_affiliations VALUES ('test-remote-member', 'SPD', 21, '2025-01-01', NULL);
    INSERT INTO member_affiliations VALUES ('test-member-without-photo', 'SPD', 21, '2025-01-01', NULL);
    INSERT INTO member_affiliations VALUES ('test-current-member', 'SPD', 21, '2026-02-01', NULL);
    INSERT INTO member_affiliations VALUES ('test-departed-member', 'SPD', 21, '2025-01-01', '2026-01-15');
    INSERT INTO member_abgeordnetenwatch VALUES ('test-local-member', '{}');
    INSERT INTO member_abgeordnetenwatch VALUES ('test-remote-member', '{}');
    INSERT INTO member_abgeordnetenwatch VALUES ('test-member-without-photo', '{}');
    INSERT INTO member_abgeordnetenwatch VALUES ('test-current-member', '{}');
    INSERT INTO member_abgeordnetenwatch VALUES ('test-departed-member', '{}');
    INSERT INTO vote_party_summaries VALUES ('vote', 'SPD', 4, 4, 0, 0, 0);
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
  assert.deepEqual(
    members.find(({ id }) => id === 'test-current-member'),
    {
      id: 'test-current-member',
      name: 'Current Member',
      pictureUrl: null,
      party: 'SPD',
      state: 'Mecklenburg-Vorpommern',
      yearOfBirth: null,
      sex: null,
      mandateType: 'liste',
      attendance: 0,
      loyalty: null,
    },
  )
  assert.equal(members.some(({ id }) => id === 'test-departed-member'), false)

  const published = publishableMembers(db)
  assert.equal(published.length, 5)
  assert.deepEqual(published.find(({ id }) => id === 'test-current-member'), {
    id: 'test-current-member',
    lastModified: '2026-02-01',
  })
  assert.equal(published.some(({ id }) => id === 'test-departed-member'), true)

  const detail = fullMember(db, 'test-current-member', 'de', data)
  assert.equal(detail.party, 'SPD')
  assert.equal(detail.state, 'Mecklenburg-Vorpommern')
  assert.equal(detail.votesAppeared, 0)
  assert.equal(detail.attendance, 0)
  assert.equal(detail.loyalty, null)

  const party = fullParty(db, 'spd', 'de', data.translations)
  assert.deepEqual(party.members.find(({ id }) => id === 'test-current-member'), {
    id: 'test-current-member',
    name: 'Current Member',
    state: 'Mecklenburg-Vorpommern',
  })
  assert.equal(party.members.some(({ id }) => id === 'test-departed-member'), false)
  db.close()
})
