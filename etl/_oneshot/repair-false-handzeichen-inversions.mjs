import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { pinnedSourceDrucksache } from '../bundestag/handzeichen/source.mjs'

const SOURCE = JSON.parse(readFileSync(fileURLToPath(new URL('../bundestag/handzeichen/extracted/21-90.json', import.meta.url)), 'utf8'))
const REPAIRS = [
  {
    id: 'pp21-90-14-anderungsantrag-zum-abgeordnetengesetz-2026',
    index: 14,
    sourceDrucksache: '21/7031',
    regenerateContent: true,
  },
  {
    id: 'pp21-90-17-streichung-der-automatischen-anpassung-der-abgeordnetenentschadigung',
    index: 17,
    sourceDrucksache: '21/331',
    regenerateContent: false,
  },
]

const db = new Database(fileURLToPath(new URL('../../db/machtblick.sqlite', import.meta.url)))
const voteRow = db.prepare('SELECT title, inverted FROM votes WHERE id = ?')
const partyRows = db.prepare('SELECT party FROM vote_party_summaries WHERE vote_id = ?')
const updateVote = db.prepare(`
  UPDATE votes
  SET result = ?, inverted = 0,
      clean_title = CASE WHEN ? THEN NULL ELSE clean_title END,
      summary_simplified = CASE WHEN ? THEN NULL ELSE summary_simplified END,
      summary_detail = CASE WHEN ? THEN NULL ELSE summary_detail END
  WHERE id = ?
`)
const updateParty = db.prepare(`
  UPDATE vote_party_summaries
  SET position = ?, position_summary = NULL, key_points = NULL, dissent_note = NULL
  WHERE vote_id = ? AND party = ?
`)
const upsertDecision = db.prepare(`
  INSERT INTO vote_polarity_decisions (
    vote_id, inverted, source, confidence, reason, rewritten_title, original_title, decided_at
  ) VALUES (?, 0, 'official-protocol-repair', 'high', ?, NULL, ?, ?)
  ON CONFLICT(vote_id) DO UPDATE SET
    inverted = 0,
    source = excluded.source,
    confidence = excluded.confidence,
    reason = excluded.reason,
    rewritten_title = NULL,
    original_title = excluded.original_title,
    decided_at = excluded.decided_at
`)
const deletePartyDecisions = db.prepare('DELETE FROM vote_party_summary_decisions WHERE vote_id = ?')
const deletePartyTranslations = db.prepare('DELETE FROM vote_party_summary_translations WHERE vote_id = ?')
const deleteVoteDescription = db.prepare('DELETE FROM vote_description_decisions WHERE vote_id = ?')
const deleteVoteTranslation = db.prepare('DELETE FROM vote_translations WHERE vote_id = ?')

let repaired = 0
let skipped = 0
db.transaction(() => {
  for (const repair of REPAIRS) {
    const current = voteRow.get(repair.id)
    if (!current) throw new Error(`missing vote ${repair.id}`)
    const source = SOURCE.votes.find((vote) => vote.index === repair.index)
    if (!source || pinnedSourceDrucksache(repair.id) !== repair.sourceDrucksache || source.outcome !== 'abgelehnt' || !source.ja?.includes('AfD')) {
      throw new Error(`unexpected source vote ${repair.id}`)
    }
    if (!current.inverted) {
      skipped++
      continue
    }
    const parties = partyRows.all(repair.id).map((row) => row.party)
    for (const party of parties) {
      const position = source.ja?.includes(party) ? 'yes' : source.nein?.includes(party) ? 'no' : source.enth?.includes(party) ? 'abstain' : null
      if (!position) throw new Error(`missing source position ${repair.id} ${party}`)
      updateParty.run(position, repair.id, party)
    }
    updateVote.run(source.outcome, Number(repair.regenerateContent), Number(repair.regenerateContent), Number(repair.regenerateContent), repair.id)
    upsertDecision.run(
      repair.id,
      'Das Plenarprotokoll dokumentiert eine direkte Abstimmung über den Gesetzentwurf oder Änderungsantrag.',
      current.title,
      new Date().toISOString(),
    )
    deletePartyDecisions.run(repair.id)
    deletePartyTranslations.run(repair.id)
    if (repair.regenerateContent) {
      deleteVoteDescription.run(repair.id)
      deleteVoteTranslation.run(repair.id)
    }
    repaired++
  }
})()
db.close()

console.log(`repaired=${repaired} skipped=${skipped}`)
