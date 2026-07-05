import SwiftUI

struct PartyDonutRow: View {
    let summaries: [VoteDetailPayload.PartySummary]

    var body: some View {
        HStack(alignment: .top, spacing: ThemeTokens.Spacing.s) {
            ForEach(ordered) { summary in
                VStack(spacing: ThemeTokens.Spacing.xs) {
                    VoteDonutView(
                        yes: summary.yes, no: summary.no, abstain: summary.abstain, absent: summary.absent
                    )
                    .frame(width: 44, height: 44)
                    Text(PartyStyle.label(summary.party))
                        .font(.system(size: 9, weight: summary.position == .mixed ? .semibold : .regular))
                        .textCase(.uppercase)
                        .foregroundStyle(
                            summary.position == .mixed ? ThemeColor.fg : ThemeColor.secondary
                        )
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                }
                .frame(maxWidth: .infinity)
            }
        }
    }

    private var ordered: [VoteDetailPayload.PartySummary] {
        summaries.sorted {
            Double($0.yes) / Double(max($0.members, 1)) > Double($1.yes) / Double(max($1.members, 1))
        }
    }
}
