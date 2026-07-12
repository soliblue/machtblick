import { votes, voteDocuments, votePartySummaries } from '../../../../db/schema/index.ts'

export function writeVote(tx, vote, fetchedAt) {
  tx.insert(votes).values({
    id: vote.id,
    bundestagId: vote.bundestagId,
    date: vote.date,
    title: vote.title,
    isPetitionBundle: vote.title.startsWith('Sammelübersicht '),
    topic: vote.topic,
    subject: vote.subject,
    summary: vote.summary,
    document: vote.document,
    result: vote.result,
    totalMembers: vote.totalMembers,
    yes: vote.yes,
    no: vote.no,
    abstain: vote.abstain,
    absent: vote.absent,
    sourceUrl: vote.sourceUrl,
    contextJson: JSON.stringify(vote.context),
    procedureJson: JSON.stringify(vote.procedure),
    fetchedAt,
  }).run()
  for (const doc of vote.documentLinks) {
    tx.insert(voteDocuments).values({
      voteId: vote.id,
      label: doc.label,
      title: doc.title,
      url: doc.url,
    }).run()
  }
  for (const summary of vote.partySummaries) {
    tx.insert(votePartySummaries).values({
      voteId: vote.id,
      party: summary.party,
      members: summary.members,
      yes: summary.yes,
      no: summary.no,
      abstain: summary.abstain,
      absent: summary.absent,
    }).run()
  }
}
