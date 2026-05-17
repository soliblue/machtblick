import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'

const db = new Database(fileURLToPath(new URL('./machtblick.sqlite', import.meta.url)))
const termId = 21

const exits = [
  ['otte-henning', '2025-06-05', 'CDU/CSU'],
  ['baerbock-annalena', '2025-06-30', 'B90/Grüne'],
  ['foullong-uwe', '2025-07-31', 'Die Linke'],
  ['habeck-dr-robert', '2025-08-31', 'B90/Grüne'],
  ['trager-carsten', '2026-03-21', 'SPD'],
] as const

const entries = [
  ['asghari-prof-dr-reza', '2025-06-10', 'CDU/CSU'],
  ['lubcke-dr-andrea', '2025-07-01', 'B90/Grüne'],
  ['schubert-lisa', '2025-08-01', 'Die Linke'],
  ['vriesema-mayra', '2025-09-01', 'B90/Grüne'],
  ['mandrella-david', '2026-03-30', 'SPD'],
] as const

const aliases = [
  ['ladzinski-thomas-max', 'ladzinski-thomas'],
  ['zerbin-dr-daniel', 'zerbin-prof-dr-daniel'],
] as const

db.transaction(() => {
  for (const [from, to] of aliases) {
    db.prepare('UPDATE members SET bt_mdb_id = coalesce(bt_mdb_id, (SELECT bt_mdb_id FROM members WHERE id = ?)) WHERE id = ?').run(from, to)
    db.prepare('UPDATE OR IGNORE vote_members SET member_id = ? WHERE member_id = ?').run(to, from)
    db.prepare('DELETE FROM vote_members WHERE member_id = ?').run(from)
    db.prepare('UPDATE OR IGNORE antrag_signatories SET member_id = ? WHERE member_id = ?').run(to, from)
    db.prepare('DELETE FROM antrag_signatories WHERE member_id = ?').run(from)
    db.prepare('UPDATE OR IGNORE anfrage_signatories SET member_id = ? WHERE member_id = ?').run(to, from)
    db.prepare('DELETE FROM anfrage_signatories WHERE member_id = ?').run(from)
    db.prepare('UPDATE speeches SET speaker_member_id = ? WHERE speaker_member_id = ?').run(to, from)
    db.prepare('UPDATE OR IGNORE member_abgeordnetenwatch SET member_id = ? WHERE member_id = ?').run(to, from)
    db.prepare('DELETE FROM member_abgeordnetenwatch WHERE member_id = ?').run(from)
    db.prepare('UPDATE OR IGNORE member_mandates SET member_id = ? WHERE member_id = ?').run(to, from)
    db.prepare('DELETE FROM member_mandates WHERE member_id = ?').run(from)
    db.prepare('UPDATE OR IGNORE member_affiliations SET member_id = ? WHERE member_id = ?').run(to, from)
    db.prepare('DELETE FROM member_affiliations WHERE member_id = ?').run(from)
    db.prepare('DELETE FROM members WHERE id = ?').run(from)
  }

  db.prepare(`
    INSERT INTO member_mandates (member_id, term_id, bt_mdb_id, valid_from, valid_to)
    VALUES ('otte-henning', ?, '00001475', '2025-03-25', '2025-06-05')
    ON CONFLICT(member_id, term_id, valid_from) DO UPDATE SET valid_to = excluded.valid_to
  `).run(termId)
  db.prepare(`
    INSERT INTO member_affiliations (member_id, term_id, party, valid_from, valid_to)
    VALUES ('otte-henning', ?, 'CDU/CSU', '2025-03-25', '2025-06-05')
    ON CONFLICT(member_id, term_id, valid_from) DO UPDATE SET party = excluded.party, valid_to = excluded.valid_to
  `).run(termId)

  for (const [memberId, validTo] of exits) {
    db.prepare('UPDATE member_mandates SET valid_to = ? WHERE member_id = ? AND term_id = ?').run(validTo, memberId, termId)
    db.prepare('UPDATE member_affiliations SET valid_to = ? WHERE member_id = ? AND term_id = ?').run(validTo, memberId, termId)
  }

  for (const [memberId, validFrom, party] of entries) {
    db.prepare('UPDATE member_mandates SET valid_from = ?, valid_to = NULL WHERE member_id = ? AND term_id = ?').run(validFrom, memberId, termId)
    db.prepare('UPDATE member_affiliations SET valid_from = ?, valid_to = NULL WHERE member_id = ? AND term_id = ? AND party = ?').run(validFrom, memberId, termId, party)
  }
})()

console.log('normalized term 21 member replacements')
db.close()
