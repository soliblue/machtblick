import Foundation

enum VoteDebateAdapter {
    static func speeches(_ detail: VoteDetailPayload) -> [SpeechSummary] {
        let choices = Dictionary(
            detail.memberBallots.map { ($0.memberId, $0.choice) }, uniquingKeysWith: { first, _ in first })
        return detail.debate.sorted { $0.position < $1.position }.map { entry in
            SpeechSummary(
                id: entry.id, speakerName: entry.speakerName, speakerMemberId: entry.speakerMemberId,
                speakerRole: entry.speakerRole, party: entry.party, excerpt: entry.excerpt,
                contributionType: entry.contributionType, date: entry.date,
                choice: entry.speakerMemberId.flatMap { choices[$0] },
                pictureUrl: entry.speakerMemberId.map { "/members-photos/\($0).jpg" })
        }
    }

    static func partySummaries(_ detail: VoteDetailPayload) -> [PartySummaryReader] {
        let withText = detail.partySummaries.filter { $0.positionSummary != nil }
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
