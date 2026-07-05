import SwiftUI

struct VoteDonutGrid: View {
    let summaries: [VoteDetailPayload.PartySummary]

    var body: some View {
        LazyVGrid(
            columns: Array(repeating: GridItem(.flexible(), spacing: ThemeTokens.Spacing.m), count: 3),
            spacing: ThemeTokens.Spacing.l
        ) {
            ForEach(summaries) { summary in
                VStack(spacing: ThemeTokens.Spacing.xs) {
                    VoteDonutView(
                        yes: summary.yes, no: summary.no, abstain: summary.abstain, absent: summary.absent
                    )
                    .frame(width: 72, height: 72)
                    Text(PartyStyle.label(summary.party))
                        .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                        .foregroundStyle(PartyStyle.color(summary.party))
                    Text(breakdown(summary))
                        .font(.system(size: ThemeTokens.Text.s))
                        .foregroundStyle(ThemeColor.secondary)
                        .monospacedDigit()
                }
            }
        }
    }

    private func breakdown(_ summary: VoteDetailPayload.PartySummary) -> String {
        let counts = [
            (summary.yes, Copy.yes), (summary.no, Copy.no), (summary.abstain, Copy.abstain),
        ]
        let top = counts.sorted { $0.0 > $1.0 }.prefix(2).filter { $0.0 > 0 }
        return top.map { "\($0.0) \($0.1)" }.joined(separator: " · ")
    }
}
