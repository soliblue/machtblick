import Foundation

struct VoteListItem: Decodable, Identifiable {
    let id: String
    let title: String
    let cleanTitle: String
    let date: String
    let result: VoteResult
    let initiator: String?
    let yes: Int
    let no: Int
    let abstain: Int
    let absent: Int
    let voteType: String?
    let topic: String?
    let summarySimplified: String?
    let partySummaries: [PartyVoteSummary]?

    var totalMembers: Int {
        yes + no + abstain + absent
    }
}
