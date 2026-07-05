import SwiftUI

struct PartyVoteRow: View {
    let vote: PartyDetailPayload.VoteEntry

    var body: some View {
        NavigationLink(value: AppRoute.vote(vote.voteId)) {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
                HStack(spacing: ThemeTokens.Spacing.s) {
                    Text(vote.partyVote.label)
                        .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                        .foregroundStyle(vote.partyVote.color)
                        .padding(.horizontal, ThemeTokens.Spacing.s)
                        .padding(.vertical, ThemeTokens.Spacing.xs)
                        .background(vote.partyVote.color.opacity(0.15))
                    Text(vote.result.label)
                        .font(.system(size: ThemeTokens.Text.s))
                        .foregroundStyle(vote.result.color)
                    Spacer()
                    Text(Formatters.shortDate(vote.date)).kicker()
                }
                Text(vote.cleanTitle)
                    .font(.system(size: ThemeTokens.Text.m))
                    .foregroundStyle(ThemeColor.fg)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
            }
            .padding(.vertical, ThemeTokens.Spacing.s)
            .frame(maxWidth: .infinity, alignment: .leading)
            .overlay(alignment: .bottom) {
                Rectangle().fill(ThemeColor.border).frame(height: ThemeTokens.Stroke.s)
            }
        }
        .buttonStyle(.plain)
    }
}
