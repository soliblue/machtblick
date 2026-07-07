import SwiftUI

struct ProposalRow: View {
    let proposal: PartyDetailPayload.Proposal
    var showDivider = true

    var body: some View {
        NavigationLink(value: AppRoute.vote(proposal.voteId)) {
            HStack(alignment: .firstTextBaseline, spacing: ThemeTokens.Spacing.s) {
                VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
                    Text(proposal.cleanTitle ?? proposal.title)
                        .font(.display(ThemeTokens.Text.l))
                        .foregroundStyle(ThemeColor.fg)
                        .multilineTextAlignment(.leading)
                    Text(Formatters.shortDate(proposal.date)).kicker()
                }
                Spacer(minLength: ThemeTokens.Spacing.s)
                StampView(label: proposal.result.label, color: proposal.result.color)
            }
            .padding(.vertical, ThemeTokens.Spacing.m)
            .frame(maxWidth: .infinity, alignment: .leading)
            .overlay(alignment: .top) {
                if showDivider {
                    Rectangle().fill(ThemeColor.border).frame(height: ThemeTokens.Stroke.s)
                }
            }
        }
        .buttonStyle(.plain)
    }
}
