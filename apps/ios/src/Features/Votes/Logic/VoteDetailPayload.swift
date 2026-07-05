import Foundation

struct VoteDetailPayload: Decodable {
    struct Info: Decodable {
        let id: String
        let bundestagId: Int?
        let voteType: String
        let date: String
        let agendaItem: String?
        let title: String
        let cleanTitle: String
        let topic: String?
        let subject: String?
        let summary: String?
        let summarySimplified: String?
        let summaryDetail: String?
        let document: String?
        let initiator: String?
        let result: VoteResult
        let procedural: Bool
        let inverted: Bool
        let isPetitionBundle: Bool
        let totalMembers: Int
        let yes: Int
        let no: Int
        let abstain: Int
        let absent: Int
        let sourceUrl: String
        let contextJson: String?
        let procedureJson: String?
        let fetchedAt: String
    }

    struct Document: Decodable, Identifiable {
        let id: Int
        let voteId: String
        let label: String
        let title: String
        let url: String
    }

    struct PartySummary: Decodable, Identifiable {
        let voteId: String
        let party: String
        let position: PartyPosition
        let members: Int
        let yes: Int
        let no: Int
        let abstain: Int
        let absent: Int
        let positionSummary: String?
        let keyPoints: String?
        let dissentNote: String?

        var id: String { party }
    }

    struct DefectorMember: Decodable, Identifiable {
        let id: String
        let name: String
        let choice: BallotChoice
        let pictureUrl: String?
    }

    struct DefectorGroup: Decodable, Identifiable {
        let party: String
        let majority: BallotChoice
        let count: Int
        let members: [DefectorMember]

        var id: String { party }
    }

    struct Ballot: Decodable, Identifiable {
        let memberId: String
        let name: String
        let party: String
        let choice: BallotChoice

        var id: String { memberId }
    }

    struct DebateEntry: Decodable, Identifiable {
        let id: String
        let speakerName: String
        let speakerMemberId: String?
        let speakerRole: String?
        let party: String?
        let date: String
        let agendaItem: String?
        let agendaTitle: String?
        let debateGroupId: String?
        let contributionType: String?
        let position: Int
        let excerpt: String
    }

    let vote: Info
    let documents: [Document]
    let partySummaries: [PartySummary]
    let proposingParty: String?
    let defectors: [DefectorGroup]
    let memberBallots: [Ballot]
    let debate: [DebateEntry]
    let debateSource: String
    let antragPdfUrl: String?
}
