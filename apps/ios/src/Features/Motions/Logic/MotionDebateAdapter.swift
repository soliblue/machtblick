import Foundation

enum MotionDebateAdapter {
    static func speeches(
        _ detail: MotionDetailPayload, linkedVoteDetails: [String: VoteDetailPayload]
    ) -> [SpeechSummary] {
        let positions = Dictionary(
            (detail.debate ?? []).map { ($0.id, $0.position) }
                + detail.linkedVotes.flatMap { vote in
                    (linkedVoteDetails[vote.id]?.debate ?? []).map { ($0.id, $0.position) }
                }, uniquingKeysWith: { first, _ in first })
        let choices = Dictionary(
            detail.linkedVotes.flatMap { linkedVoteDetails[$0.id]?.memberBallots ?? [] }
                .map { ($0.memberId, $0.choice) }, uniquingKeysWith: { first, _ in first })
        var seen: Set<String> = []
        return ((detail.debate ?? []).map { entry in
            SpeechSummary(
                id: entry.id, speakerName: entry.speakerName, speakerMemberId: entry.speakerMemberId,
                speakerRole: entry.speakerRole, party: entry.party, excerpt: entry.excerpt,
                contributionType: entry.contributionType, date: entry.date, choice: nil,
                pictureUrl: entry.speakerMemberId.map(Endpoints.memberPhoto))
        } + detail.linkedVotes.flatMap { vote in
            linkedVoteDetails[vote.id].map(VoteDebateAdapter.speeches) ?? []
        })
        .filter { seen.insert($0.id).inserted }
        .map { speech in
            var speech = speech
            speech.choice = speech.speakerMemberId.flatMap { choices[$0] }
            return speech
        }
        .sorted {
            ($0.date ?? "") == ($1.date ?? "")
                ? (positions[$0.id] ?? 0) < (positions[$1.id] ?? 0)
                : ($0.date ?? "") < ($1.date ?? "")
        }
    }

    static func partySummaries(
        _ detail: MotionDetailPayload, linkedVoteDetails: [String: VoteDetailPayload]
    ) -> [PartySummaryReader] {
        var seen: Set<String> = []
        let summaries = detail.linkedVotes.flatMap { vote in
            (linkedVoteDetails[vote.id].map(VoteDebateAdapter.partySummaries) ?? [])
                + partySummaries([vote])
        }.filter { seen.insert($0.party).inserted }
        return PartyStyle.order.compactMap { party in summaries.first { $0.party == party } }
            + summaries.filter { !PartyStyle.order.contains($0.party) }
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
