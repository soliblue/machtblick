import { db } from '@machtblick/db/client'
import { loadSeed } from './read/seedFile.mjs'
import { loadMemberVotes } from './read/memberJson.mjs'
import { buildMemberIdResolver } from './transform/memberId.mjs'
import { writeVote } from './write/votes.mjs'
import { upsertMembers } from './write/members.mjs'
import { writeVoteMembers } from './write/voteMembers.mjs'

const { rollCallVotes, votesUpdatedAt } = await loadSeed()
const resolveMemberId = buildMemberIdResolver()

for (const vote of rollCallVotes) {
  const memberVotes = await loadMemberVotes(vote.id)
  const resolved = memberVotes.map((m) => ({ ...m, id: resolveMemberId(m.name, m.state) }))
  db.transaction((tx) => {
    writeVote(tx, vote, votesUpdatedAt)
    upsertMembers(tx, resolved)
    writeVoteMembers(tx, vote.id, resolved)
  })
  console.log(`imported ${vote.id} (${resolved.length} members)`)
}

console.log(`\ndone. member-id collisions: ${resolveMemberId.collisionCount()}`)
