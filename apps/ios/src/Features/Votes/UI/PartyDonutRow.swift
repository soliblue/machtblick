import SwiftUI

struct PartyDonutRow: View {
    let summaries: [PartyVoteSummary]

    var body: some View {
        HStack(alignment: .top, spacing: ThemeTokens.Spacing.s) {
            ForEach(ordered) { summary in
                VStack(spacing: ThemeTokens.Spacing.xs) {
                    VoteDonutView(
                        yes: summary.yes, no: summary.no, abstain: summary.abstain, absent: summary.absent,
                        position: summary.position
                    )
                    .frame(width: 44, height: 44)
                    Text(PartyStyle.label(summary.party))
                        .font(.system(size: 9, weight: emphasized(summary) ? .semibold : .regular))
                        .textCase(.uppercase)
                        .foregroundStyle(emphasized(summary) ? ThemeColor.fg : ThemeColor.secondary)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                }
                .frame(maxWidth: .infinity)
            }
        }
    }

    private func emphasized(_ summary: PartyVoteSummary) -> Bool {
        summary.position == .mixed || summary.position == .split
    }

    private var ordered: [PartyVoteSummary] {
        summaries.sorted {
            Double($0.yes) / Double(max($0.memberCount, 1))
                > Double($1.yes) / Double(max($1.memberCount, 1))
        }
    }
}
