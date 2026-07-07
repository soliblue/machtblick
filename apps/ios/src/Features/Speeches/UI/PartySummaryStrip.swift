import SwiftUI

struct PartySummaryStrip: View {
    let summaries: [PartySummaryReader]
    let onOpen: (Int) -> Void

    var body: some View {
        if !summaries.isEmpty {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.l) {
                Text("\(Copy.partySummariesTitle) · \(summaries.count)").kicker()
                ForEach(Array(summaries.enumerated()), id: \.element.id) { index, summary in
                    PartySummaryBubble(summary: summary) { onOpen(index) }
                        .padding(.trailing, ThemeTokens.Spacing.xl)
                }
            }
        }
    }
}
