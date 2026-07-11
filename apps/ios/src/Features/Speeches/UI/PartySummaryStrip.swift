import SwiftUI

struct PartySummaryStrip: View {
    let summaries: [PartySummaryReader]
    let speeches: [SpeechSummary]

    var body: some View {
        if !summaries.isEmpty {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
                Text("\(Copy.partySummariesTitle) · \(summaries.count)").kicker()
                ScrollView(.horizontal, showsIndicators: false) {
                    EqualHeightHStack(spacing: ThemeTokens.Spacing.m) {
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

private struct EqualHeightHStack: Layout {
    let spacing: CGFloat

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let sizes = subviews.map { $0.sizeThatFits(.unspecified) }
        return CGSize(
            width: sizes.map(\.width).reduce(0, +) + spacing * CGFloat(max(subviews.count - 1, 0)),
            height: sizes.map(\.height).max() ?? 0
        )
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            subview.place(
                at: CGPoint(x: x, y: bounds.minY),
                anchor: .topLeading,
                proposal: ProposedViewSize(width: size.width, height: bounds.height)
            )
            x += size.width + spacing
        }
    }
}
