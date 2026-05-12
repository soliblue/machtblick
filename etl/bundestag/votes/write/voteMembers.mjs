import { voteMembers } from '/Users/soli/machtblick/db/schema/index.ts'

export function writeVoteMembers(tx, voteId, rows) {
  const batchSize = 200
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize).map((r) => ({
      voteId,
      memberId: r.id,
      party: r.party,
      state: r.state,
      choice: r.vote,
    }))
    tx.insert(voteMembers).values(batch).run()
  }
}
