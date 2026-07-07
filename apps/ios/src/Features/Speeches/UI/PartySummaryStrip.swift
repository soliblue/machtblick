import SwiftUI

struct PartySummaryStrip: View {
    let summaries: [PartySummaryReader]

    var body: some View {
        if !summaries.isEmpty {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.l) {
                Text("\(Copy.partySummariesTitle) · \(summaries.count)").kicker()
                ForEach(summaries) { summary in
                    PartySummaryBubble(summary: summary)
                        .padding(.trailing, ThemeTokens.Spacing.xl)
                }
            }
        }
    }
}
