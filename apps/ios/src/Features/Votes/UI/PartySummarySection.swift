import SwiftUI

struct PartySummarySection: View {
    let summaries: [VoteDetailPayload.PartySummary]

    var body: some View {
        let relevant = summaries.filter { $0.positionSummary != nil || $0.keyPoints != nil }
        if !relevant.isEmpty {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
                Text(Copy.partiesSection).kicker()
                ForEach(relevant) { summary in
                    VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
                        HStack(spacing: ThemeTokens.Spacing.s) {
                            PartyBadge(party: summary.party)
                            Text(summary.position.label)
                                .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                                .foregroundStyle(summary.position.color)
                            Spacer()
                        }
                        if let text = summary.positionSummary {
                            Text(text).font(.serif(ThemeTokens.Text.m))
                        }
                        if let points = summary.keyPoints {
                            MarkdownText(markdown: points)
                        }
                        if let dissent = summary.dissentNote {
                            Text(dissent)
                                .font(.system(size: ThemeTokens.Text.s))
                                .foregroundStyle(ThemeColor.secondary)
                        }
                    }
                    .padding(ThemeTokens.Spacing.m)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .overlay(Rectangle().strokeBorder(ThemeColor.border, lineWidth: ThemeTokens.Stroke.s))
                }
            }
        }
    }
}
