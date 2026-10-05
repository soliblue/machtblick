struct VoteResultsModel {
    let id: String
    let rows: [VoteResultRow]

    var columns: [VoteResultColumn] {
        [.yes, .no, .abstain, .absent] + (rows.contains { ($0.unknown ?? 0) > 0 } ? [.unknown] : [])
    }

    init(detail: VoteDetailPayload) {
        id = detail.vote.id
        rows = [
            VoteResultRow(
                members: detail.vote.totalMembers, yes: detail.vote.yes, no: detail.vote.no,
                abstain: detail.vote.abstain, absent: detail.vote.absent,
                voteType: detail.vote.voteType)
        ] + detail.partySummaries.sorted { $0.members > $1.members }.map {
            VoteResultRow(
                party: $0.party, members: $0.members, yes: $0.yes, no: $0.no,
                abstain: $0.abstain, absent: $0.absent, voteType: detail.vote.voteType)
        }
    }

    init(vote: MotionDetailPayload.LinkedVote) {
        id = vote.id
        rows = [
            VoteResultRow(
                members: vote.totalMembers, yes: vote.yes, no: vote.no,
                abstain: vote.abstain, absent: vote.absent, voteType: vote.voteType)
        ]
    }
}
