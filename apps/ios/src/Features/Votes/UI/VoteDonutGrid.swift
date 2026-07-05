import SwiftUI

struct VoteDonutGrid: View {
    let summaries: [PartyVoteSummary]
    var selected: VoteChoice?

    var body: some View {
        LazyVGrid(
            columns: Array(repeating: GridItem(.flexible(), spacing: ThemeTokens.Spacing.m), count: 3),
            spacing: ThemeTokens.Spacing.l
        ) {
            ForEach(PartyVoteOrder.byJaShare(summaries)) { summary in
                NavigationLink(value: AppRoute.party(PartyStyle.slug(summary.party))) {
                    VStack(spacing: ThemeTokens.Spacing.xs) {
                        VoteDonutView(
                            yes: summary.yes, no: summary.no, abstain: summary.abstain,
                            absent: summary.absent, selected: selected
                        )
                        .frame(width: 72, height: 72)
                        Text(PartyStyle.label(summary.party))
                            .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                            .foregroundStyle(PartyStyle.color(summary.party))
                        breakdown(summary)
                    }
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func breakdown(_ summary: PartyVoteSummary) -> some View {
        let top = VoteChoice.allCases
            .filter { summary.count($0) > 0 }
            .sorted { summary.count($0) > summary.count($1) }
            .prefix(2)
        return VStack(spacing: 0) {
            ForEach(Array(top), id: \.self) { choice in
                (Text("\(choice.label) ").foregroundStyle(ThemeColor.secondary)
                    + Text("\(summary.count(choice))").foregroundStyle(choice.color))
                    .font(.system(size: ThemeTokens.Text.s))
                    .monospacedDigit()
            }
        }
    }
}
