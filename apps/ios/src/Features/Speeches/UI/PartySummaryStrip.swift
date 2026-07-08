import SwiftUI

struct PartySummaryStrip: View {
    let summaries: [PartySummaryReader]
    let speeches: [SpeechSummary]

    var body: some View {
        if !summaries.isEmpty {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
                Text("\(Copy.partySummariesTitle) · \(summaries.count)").kicker()
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(alignment: .top, spacing: ThemeTokens.Spacing.m) {
                        ForEach(summaries) { summary in
                            PartySummaryBubble(summary: summary, speakers: speakers(for: summary.party))
                                .frame(width: 300, alignment: .topLeading)
                        }
                    }
                }
                .edgeToEdgeScroll()
            }
        }
    }

    private func speakers(for party: String) -> [AvatarPile.Person] {
        var seen: Set<String> = []
        var result: [AvatarPile.Person] = []
        for speech in speeches where speech.party == party {
            guard let id = speech.speakerMemberId, !seen.contains(id) else { continue }
            seen.insert(id)
            result.append(.init(id: id, name: speech.speakerName, pictureUrl: speech.pictureUrl))
        }
        return result
    }
}
