import Foundation

struct PartyDetailPayload: Decodable {
    struct Proposal: Decodable, Identifiable {
        let voteId: String
        let date: String
        let title: String
        let cleanTitle: String?
        let result: VoteResult

        var id: String { voteId }
    }

    struct Donation: Decodable, Identifiable {
        let id: String
        let donor: String
        let amountEur: Int
        let dateReceived: String
    }

    struct VoteEntry: Decodable, Identifiable {
        let voteId: String
        let date: String
        let title: String
        let cleanTitle: String
        let result: VoteResult
        let partyVote: PartyPosition
        let cohesion: Double?
        let yes: Int
        let no: Int
        let abstain: Int
        let absent: Int
        let members: Int

        var id: String { voteId }
    }

    struct MemberRef: Decodable, Identifiable {
        let id: String
        let name: String
        let state: String
    }

    struct Alignment: Decodable, Identifiable {
        let party: String
        let agreement: Double
        let sharedVotes: Int

        var id: String { party }
    }

    let slug: String
    let party: String
    let seats: Int
    let cohesion: Double
    let attendance: Double
    let successRate: Double
    let successMatched: Int?
    let successDecided: Int?
    let proposalsTotal: Int
    let proposalsAccepted: Int
    let proposals: [Proposal]
    let donations: [Donation]
    let donationsTotalEur: Int
    let donationsCount: Int
    let votes: [VoteEntry]
    let members: [MemberRef]
    let alignments: [Alignment]
    let history: PartyHistory?
}
