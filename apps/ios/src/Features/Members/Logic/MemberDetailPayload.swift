import Foundation

struct MemberDetailPayload: Decodable {
    struct HistoryEntry: Decodable, Identifiable {
        let voteId: String
        let date: String
        let title: String
        let cleanTitle: String
        let result: VoteResult
        let choice: BallotChoice
        let party: String
        let partyMajority: String
        let defected: Bool?

        var id: String { voteId }
    }

    struct SpeechEntry: Decodable, Identifiable {
        let id: String
        let speakerName: String
        let speakerMemberId: String?
        let speakerRole: String?
        let party: String?
        let position: Int
        let excerpt: String
        let date: String
        let agendaItem: String?
        let agendaTitle: String?
        let debateGroupId: String?
        let contributionType: String?
        let voteId: String?
        let voteTitle: String?
        let snippet: String?
    }

    struct InitiativeVote: Decodable, Identifiable {
        let voteId: String
        let date: String
        let title: String
        let cleanTitle: String
        let result: VoteResult

        var id: String { voteId }
    }

    struct Initiative: Decodable, Identifiable {
        let antragId: Int
        let title: String
        let cleanTitle: String?
        let beratungsstand: String?
        let introducedDate: String?
        let drucksachePdfUrl: String?
        let sachgebiet: [String]
        let signatoryCount: Int
        let linkedVotes: [InitiativeVote]

        var id: Int { antragId }
    }

    let id: String
    let name: String
    let party: String
    let state: String
    let attendance: Double
    let loyalty: Double?
    let votesAppeared: Int
    let defections: Int
    let history: [HistoryEntry]
    let speeches: [SpeechEntry]
    let initiatives: [Initiative]?
    let pictureUrl: String?
    let pictureAuthor: String?
    let pictureLicense: String?
    let pictureSourceUrl: String?
    let yearOfBirth: Int?
    let sex: String?
    let mandateType: String?
    let listState: String?
    let constituencyNumber: String?
    let constituencyName: String?
    let education: String?
}
