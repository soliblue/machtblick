import Database from 'better-sqlite3'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseAgendaProtocol } from '../etl/bundestag-reden-xml/agenda.ts'
import { CURRENT_TERM } from '../apps/bundestag/src/server/term.ts'
import { PARTY_ALIAS_SEED_ROWS, normalizePartyList } from './partyPatterns'

type AgendaRow = {
  sessionId: string
  date: string
  agendaItem: string
  sourceTitle: string
  title: string
  sourceUrl: string
}

type SpeechRow = {
  id: string
  session_id: string
  date: string
  agenda_item: string | null
  position: number
  word_count: number
  title: string | null
}

type AntragRow = {
  id: number
  abstract: string | null
  initiative_fraktion: string | null
}

type DocumentRow = {
  id: number
  vote_id: string
  label: string
  title: string
}

const dbPath = process.env.MACHTBLICK_DB ?? fileURLToPath(new URL('./machtblick.sqlite', import.meta.url))
const rawAgendaDir = fileURLToPath(new URL('../etl/bundestag-reden-xml/raw/xml/', import.meta.url))
const fallbackAgendaPath = fileURLToPath(new URL('../etl/bundestag-reden-xml/fallback-agenda-items.json', import.meta.url))
const db = new Database(dbPath)
const ANTRAG_FLAVORED = ['Antrag:', 'Gesetzentwurf:', 'Entschließungsantrag:', 'Änderungsantrag:']
const ANTRAG_EXCLUDED = ['Beschlussempfehlung', 'Bericht:', 'Ergänzung', 'Wahlvorschlag', 'Unterrichtung', 'Verordnung']

db.pragma('foreign_keys = ON')

const summary = db.transaction(() => {
  ensureSchema()
  const aliases = materializePartyAliases()
  const agendas = materializeAgendaItems()
  const abstracts = materializeAntraege()
  const handzeichenTallies = materializeHandzeichenTallies()
  const speechGroups = materializeSpeechDebateGroups()
  const speechVoteLinks = materializeSpeechVoteLinks()
  const voteDebates = materializeVoteDebateGroups()
  const documentRoles = materializeVoteDocumentRoles()
  return { aliases, agendas, abstracts, handzeichenTallies, speechGroups, speechVoteLinks, voteDebates, documentRoles }
})()

console.log(`party aliases: ${summary.aliases.aliases}, normalized speeches: ${summary.aliases.speeches}, normalized antraege: ${summary.aliases.antraege}`)
console.log(`agenda items: ${summary.agendas}`)
console.log(`antrag abstracts: ${summary.abstracts}`)
console.log(`handzeichen tallies: ${summary.handzeichenTallies.tallies}, purged seatless-party rows: ${summary.handzeichenTallies.purged}`)
console.log(`speech debate groups: ${summary.speechGroups.groups}, memberships: ${summary.speechGroups.memberships}`)
console.log(`speech vote links: direct=${summary.speechVoteLinks.direct}, agenda=${summary.speechVoteLinks.agenda}`)
console.log(`vote debate groups: ${summary.voteDebates}`)
console.log(`vote document roles: decisions=${summary.documentRoles.decisions}, inferred=${summary.documentRoles.inferred}`)

db.close()

function ensureSchema() {
  if (!hasColumn('antraege', 'abstract_plain')) db.prepare('ALTER TABLE antraege ADD COLUMN abstract_plain text').run()
  db.exec(`
    CREATE TABLE IF NOT EXISTS plenary_agenda_items (
      session_id text NOT NULL,
      date text NOT NULL,
      agenda_item text NOT NULL,
      source_title text NOT NULL,
      title text NOT NULL,
      source_url text NOT NULL,
      review_status text NOT NULL DEFAULT 'unreviewed',
      PRIMARY KEY (session_id, agenda_item)
    );
    CREATE INDEX IF NOT EXISTS plenary_agenda_items_date_agenda_idx ON plenary_agenda_items (date, agenda_item);
    CREATE TABLE IF NOT EXISTS speech_vote_links (
      speech_id text PRIMARY KEY NOT NULL REFERENCES speeches(id),
      vote_id text NOT NULL REFERENCES votes(id),
      source text NOT NULL,
      confidence integer NOT NULL,
      review_status text NOT NULL DEFAULT 'unreviewed'
    );
    CREATE INDEX IF NOT EXISTS speech_vote_links_vote_idx ON speech_vote_links (vote_id);
    CREATE TABLE IF NOT EXISTS speech_debate_groups (
      id text PRIMARY KEY NOT NULL,
      session_id text NOT NULL,
      date text NOT NULL,
      agenda_item text NOT NULL,
      title text NOT NULL,
      source text NOT NULL,
      review_status text NOT NULL DEFAULT 'unreviewed'
    );
    CREATE INDEX IF NOT EXISTS speech_debate_groups_session_agenda_idx ON speech_debate_groups (session_id, agenda_item);
    CREATE INDEX IF NOT EXISTS speech_debate_groups_date_agenda_idx ON speech_debate_groups (date, agenda_item);
    CREATE TABLE IF NOT EXISTS speech_debate_group_speeches (
      group_id text NOT NULL REFERENCES speech_debate_groups(id),
      speech_id text NOT NULL REFERENCES speeches(id),
      position integer NOT NULL,
      contribution_type text NOT NULL,
      PRIMARY KEY (group_id, speech_id)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS speech_debate_group_speeches_speech_id_unique ON speech_debate_group_speeches (speech_id);
    CREATE INDEX IF NOT EXISTS speech_debate_group_speeches_speech_idx ON speech_debate_group_speeches (speech_id);
    CREATE TABLE IF NOT EXISTS vote_debate_groups (
      vote_id text NOT NULL REFERENCES votes(id),
      group_id text NOT NULL REFERENCES speech_debate_groups(id),
      source text NOT NULL,
      review_status text NOT NULL DEFAULT 'unreviewed',
      PRIMARY KEY (vote_id, group_id)
    );
    CREATE INDEX IF NOT EXISTS vote_debate_groups_group_idx ON vote_debate_groups (group_id);
    CREATE TABLE IF NOT EXISTS vote_document_roles (
      vote_id text NOT NULL REFERENCES votes(id),
      document_id integer NOT NULL REFERENCES vote_documents(id),
      role text NOT NULL,
      source text NOT NULL,
      review_status text NOT NULL DEFAULT 'unreviewed',
      PRIMARY KEY (vote_id, document_id, role)
    );
    CREATE INDEX IF NOT EXISTS vote_document_roles_document_idx ON vote_document_roles (document_id);
    CREATE INDEX IF NOT EXISTS vote_document_roles_vote_role_idx ON vote_document_roles (vote_id, role);
    CREATE TABLE IF NOT EXISTS party_aliases (
      alias text PRIMARY KEY NOT NULL,
      canonical_party text NOT NULL,
      source text NOT NULL,
      review_status text NOT NULL DEFAULT 'unreviewed'
    );
    CREATE INDEX IF NOT EXISTS party_aliases_canonical_idx ON party_aliases (canonical_party);
  `)
}

function hasColumn(table: string, column: string) {
  return db.prepare(`PRAGMA table_info(${table})`).all().some((row) => (row as { name: string }).name === column)
}

function materializePartyAliases() {
  db.prepare('DELETE FROM party_aliases').run()
  const insertAlias = db.prepare('INSERT INTO party_aliases (alias, canonical_party, source, review_status) VALUES (?, ?, ?, ?)')
  for (const [alias, canonical] of PARTY_ALIAS_SEED_ROWS) insertAlias.run(alias, canonical, 'seed', 'unreviewed')
  const updateSpeechParty = db.prepare('UPDATE speeches SET party = ? WHERE party = ?')
  let speeches = 0
  for (const [alias, canonical] of PARTY_ALIAS_SEED_ROWS) {
    if (alias !== canonical) speeches += updateSpeechParty.run(canonical, alias).changes
  }
  const rows = db.prepare('SELECT id, abstract, initiative_fraktion FROM antraege').all() as AntragRow[]
  const updateAntragParty = db.prepare('UPDATE antraege SET initiative_fraktion = ? WHERE id = ?')
  let antraege = 0
  for (const row of rows) {
    const normalized = row.initiative_fraktion ? normalizePartyList(row.initiative_fraktion) : null
    if (normalized !== row.initiative_fraktion) antraege += updateAntragParty.run(normalized, row.id).changes
  }
  return { aliases: PARTY_ALIAS_SEED_ROWS.length, speeches, antraege }
}

function materializeAgendaItems() {
  const rows = agendaRows()
  if (rows.length === 0) return 0
  db.prepare('DELETE FROM plenary_agenda_items').run()
  const insert = db.prepare(`
    INSERT INTO plenary_agenda_items (session_id, date, agenda_item, source_title, title, source_url, review_status)
    VALUES (@sessionId, @date, @agendaItem, @sourceTitle, @title, @sourceUrl, 'unreviewed')
    ON CONFLICT(session_id, agenda_item) DO UPDATE SET
      date = excluded.date,
      source_title = excluded.source_title,
      title = excluded.title,
      source_url = excluded.source_url
  `)
  for (const row of rows) insert.run(row)
  return (db.prepare('SELECT COUNT(*) AS c FROM plenary_agenda_items').get() as { c: number }).c
}

function agendaRows(): AgendaRow[] {
  const rows = existsSync(rawAgendaDir)
    ? readdirSync(rawAgendaDir).filter((name) => name.endsWith('.xml')).sort().flatMap((file) => parseAgendaProtocol(readFileSync(join(rawAgendaDir, file), 'utf8')))
    : []
  return existsSync(fallbackAgendaPath)
    ? rows.concat(JSON.parse(readFileSync(fallbackAgendaPath, 'utf8')) as AgendaRow[])
    : rows
}

function materializeAntraege() {
  const rows = db.prepare('SELECT id, abstract, initiative_fraktion FROM antraege').all() as AntragRow[]
  const update = db.prepare('UPDATE antraege SET abstract_plain = ? WHERE id = ?')
  let changed = 0
  for (const row of rows) changed += update.run(plainText(row.abstract), row.id).changes
  return changed
}

function plainText(value: string | null) {
  return value
    ?.replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim() || null
}

function materializeHandzeichenTallies() {
  const seated = db.prepare('SELECT party_name FROM party_seat_history WHERE term_id = ?').all(CURRENT_TERM) as Array<{ party_name: string }>
  const purged = seated.length
    ? db.prepare(`
        DELETE FROM vote_party_summaries
        WHERE party NOT IN (${seated.map(() => '?').join(', ')})
          AND vote_id IN (SELECT id FROM votes WHERE term_id = ? AND vote_type != 'namentlich')
      `).run(...seated.map((row) => row.party_name), CURRENT_TERM).changes
    : 0
  const seats = new Map<string, number>()
  const namentlich = db.prepare("SELECT id FROM votes WHERE term_id = ? AND vote_type = 'namentlich' ORDER BY date DESC LIMIT 20").all(CURRENT_TERM) as Array<{ id: string }>
  for (const vote of namentlich) {
    const rows = db.prepare('SELECT party, members FROM vote_party_summaries WHERE vote_id = ?').all(vote.id) as Array<{ party: string; members: number | null }>
    for (const row of rows) if (row.members && !seats.has(row.party)) seats.set(row.party, row.members)
  }
  const rows = db.prepare(`
    SELECT vps.vote_id, vps.party, vps.position
    FROM vote_party_summaries vps
    INNER JOIN votes v ON v.id = vps.vote_id
    WHERE v.vote_type != 'namentlich'
  `).all() as Array<{ vote_id: string; party: string; position: 'yes' | 'no' | 'abstain' | 'mixed' }>
  const update = db.prepare('UPDATE vote_party_summaries SET members = @members, yes = @yes, no = @no, abstain = @abstain, absent = 0 WHERE vote_id = @voteId AND party = @party')
  for (const row of rows) {
    const m = seats.get(row.party) ?? 0
    update.run({
      members: m,
      yes: row.position === 'yes' ? m : 0,
      no: row.position === 'no' ? m : 0,
      abstain: row.position === 'abstain' ? m : 0,
      voteId: row.vote_id,
      party: row.party,
    })
  }
  return { tallies: rows.length, purged }
}

function materializeSpeechDebateGroups() {
  db.prepare('DELETE FROM vote_debate_groups').run()
  db.prepare('DELETE FROM speech_debate_group_speeches').run()
  db.prepare('DELETE FROM speech_debate_groups').run()
  const rows = db.prepare(`
    SELECT s.id, s.session_id, s.date, s.agenda_item, s.position, s.word_count, pai.title
    FROM speeches s
    LEFT JOIN plenary_agenda_items pai ON pai.session_id = s.session_id AND pai.date = s.date AND pai.agenda_item = s.agenda_item
    ORDER BY s.date ASC, s.position ASC
  `).all() as SpeechRow[]
  const insertGroup = db.prepare(`
    INSERT INTO speech_debate_groups (id, session_id, date, agenda_item, title, source, review_status)
    VALUES (@id, @sessionId, @date, @agendaItem, @title, 'agenda_item', 'unreviewed')
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      review_status = speech_debate_groups.review_status
  `)
  const insertSpeech = db.prepare('INSERT INTO speech_debate_group_speeches (group_id, speech_id, position, contribution_type) VALUES (?, ?, ?, ?)')
  const groups = new Set<string>()
  for (const row of rows) {
    const agendaItem = row.agenda_item ?? ''
    const groupId = agendaItem ? `${row.session_id}:${agendaItem}` : `speech:${row.id}`
    if (!groups.has(groupId)) {
      insertGroup.run({ id: groupId, sessionId: row.session_id, date: row.date, agendaItem, title: row.title ?? (agendaItem || 'Rede') })
      groups.add(groupId)
    }
    insertSpeech.run(groupId, row.id, row.position, row.word_count < 24 ? 'short' : 'speech')
  }
  return { groups: groups.size, memberships: rows.length }
}

function materializeSpeechVoteLinks() {
  db.prepare('DELETE FROM speech_vote_links').run()
  const direct = db.prepare(`
    INSERT INTO speech_vote_links (speech_id, vote_id, source, confidence, review_status)
    SELECT s.id, s.vote_id, 'direct', 100, 'unreviewed'
    FROM speeches s
    INNER JOIN votes v ON v.id = s.vote_id
    WHERE s.vote_id IS NOT NULL
  `).run().changes
  const agenda = db.prepare(`
    INSERT OR IGNORE INTO speech_vote_links (speech_id, vote_id, source, confidence, review_status)
    SELECT speech_id, vote_id, 'agenda_item', 60, 'unreviewed'
    FROM (
      SELECT s.id AS speech_id,
             (
               SELECT av.id
               FROM votes av
               WHERE av.term_id = ?
                 AND av.procedural = 0
                 AND av.vote_type != 'hammelsprung'
                 AND av.date = s.date
                 AND av.agenda_item = s.agenda_item
               ORDER BY CASE av.vote_type WHEN 'namentlich' THEN 0 WHEN 'handzeichen' THEN 1 ELSE 2 END, av.id
               LIMIT 1
             ) AS vote_id
      FROM speeches s
      WHERE s.vote_id IS NULL AND s.agenda_item IS NOT NULL
    )
    WHERE vote_id IS NOT NULL
  `).run(CURRENT_TERM).changes
  return { direct, agenda }
}

function materializeVoteDebateGroups() {
  db.prepare('DELETE FROM vote_debate_groups').run()
  db.prepare(`
    INSERT OR IGNORE INTO vote_debate_groups (vote_id, group_id, source, review_status)
    SELECT v.id, sdg.id, 'direct', 'unreviewed'
    FROM votes v
    INNER JOIN speech_debate_groups sdg ON sdg.date = v.date AND sdg.agenda_item = v.agenda_item
    WHERE v.term_id = ? AND v.procedural = 0 AND v.vote_type != 'hammelsprung' AND v.agenda_item IS NOT NULL
  `).run(CURRENT_TERM)
  db.prepare(`
    INSERT OR IGNORE INTO vote_debate_groups (vote_id, group_id, source, review_status)
    SELECT svl.vote_id, sdgs.group_id, CASE WHEN v.date = s.date THEN 'direct' ELSE 'related' END, 'unreviewed'
    FROM speech_vote_links svl
    INNER JOIN votes v ON v.id = svl.vote_id
    INNER JOIN speech_debate_group_speeches sdgs ON sdgs.speech_id = svl.speech_id
    INNER JOIN speeches s ON s.id = svl.speech_id
  `).run()
  return (db.prepare('SELECT COUNT(*) AS c FROM vote_debate_groups').get() as { c: number }).c
}

function materializeVoteDocumentRoles() {
  db.prepare('DELETE FROM vote_document_roles').run()
  const decisions = db.prepare(`
    INSERT OR IGNORE INTO vote_document_roles (vote_id, document_id, role, source, review_status)
    SELECT vdd.vote_id, vd.id, 'primary_antrag', 'description_decision', 'unreviewed'
    FROM vote_description_decisions vdd
    INNER JOIN vote_documents vd ON vd.vote_id = vdd.vote_id AND (vd.url = vdd.source_pdf_url OR vd.label = vdd.drucksache_id)
  `).run().changes
  const roleVotes = new Set((db.prepare("SELECT DISTINCT vote_id FROM vote_document_roles WHERE role IN ('primary_antrag', 'antrag')").all() as Array<{ vote_id: string }>).map((row) => row.vote_id))
  const docs = db.prepare('SELECT id, vote_id, label, title FROM vote_documents ORDER BY vote_id, id').all() as DocumentRow[]
  const byVote = new Map<string, DocumentRow[]>()
  const insert = db.prepare("INSERT OR IGNORE INTO vote_document_roles (vote_id, document_id, role, source, review_status) VALUES (?, ?, 'primary_antrag', 'title_prefix', 'unreviewed')")
  let inferred = 0
  for (const doc of docs) {
    const rows = byVote.get(doc.vote_id) ?? []
    rows.push(doc)
    byVote.set(doc.vote_id, rows)
  }
  for (const [voteId, rows] of byVote) {
    const hit = roleVotes.has(voteId) ? null : pickPrimaryDocument(rows)
    if (hit) inferred += insert.run(voteId, hit.id).changes
  }
  return { decisions, inferred }
}

function pickPrimaryDocument(rows: DocumentRow[]) {
  return rows
    .filter((row) => ANTRAG_FLAVORED.some((prefix) => row.title.startsWith(prefix)) && !ANTRAG_EXCLUDED.some((prefix) => row.title.startsWith(prefix)))
    .sort((a, b) => drucksacheRank(a.label) - drucksacheRank(b.label))[0] ?? null
}

function drucksacheRank(label: string) {
  const match = label.match(/^(\d+)\/(\d+)$/)
  return match ? Number(match[1]) * 1_000_000 + Number(match[2]) : Number.MAX_SAFE_INTEGER
}
