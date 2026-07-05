import Foundation

struct MotionDetailPayload: Decodable {
    struct Antrag: Decodable {
        struct Deskriptor: Decodable {
            let name: String
            let typ: String
        }

        let id: Int
        let type: String
        let title: String
        let cleanTitle: String?
        let abstract: String?
        let beratungsstand: String?
        let initiativeFraktion: String?
        let introducedDate: String?
        let drucksache: String?
        let drucksachePdfUrl: String?
        let sachgebiet: [String]
        let deskriptor: [Deskriptor]
        let summarySimplified: String?
        let summaryDetail: String?
    }

    struct Signatory: Decodable, Identifiable {
        let memberId: String
        let displayName: String
        let portraitUrl: String?

        var id: String { memberId }
    }

    struct LinkedVote: Decodable, Identifiable {
        let id: String
        let date: String
        let title: String
        let cleanTitle: String
        let result: VoteResult
        let voteType: String
        let yes: Int?
        let no: Int?
        let abstain: Int?
        let absent: Int?
        let totalMembers: Int?
        let partySummaries: [PartyVoteSummary]?
    }

    let antrag: Antrag
    let signatories: [Signatory]
    let linkedVotes: [LinkedVote]
}
