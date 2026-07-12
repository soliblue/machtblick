import Foundation

enum MotionDebateAdapter {
    static func speeches(_ debate: [MotionDetailPayload.DebateEntry]) -> [SpeechSummary] {
        debate.sorted { $0.position < $1.position }.map { entry in
            SpeechSummary(
                id: entry.id, speakerName: entry.speakerName, speakerMemberId: entry.speakerMemberId,
                speakerRole: entry.speakerRole, party: entry.party, excerpt: entry.excerpt,
                contributionType: entry.contributionType, date: entry.date, choice: nil,
                pictureUrl: entry.speakerMemberId.map(Endpoints.memberPhoto))
        }
    }

    static func partySummaries(_ linkedVotes: [MotionDetailPayload.LinkedVote]) -> [PartySummaryReader] {
        let source = linkedVotes.compactMap(\.partySummaries).first { !$0.isEmpty } ?? []
        let withText = source.filter { $0.positionSummary != nil }
        let ordered = PartyStyle.order.compactMap { name in withText.first { $0.party == name } }
        let seen = Set(ordered.map(\.party))
        return (ordered + withText.filter { !seen.contains($0.party) }).map { summary in
            PartySummaryReader(
                party: summary.party,
                stance: StanceRules.of(yes: summary.yes, no: summary.no, abstain: summary.abstain),
                positionSummary: summary.positionSummary, keyPoints: summary.keyPoints,
                dissentNote: summary.dissentNote)
        }
    }
}
