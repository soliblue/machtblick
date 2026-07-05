import SwiftUI

struct PartyVoteRow: View {
    let vote: PartyDetailPayload.VoteEntry

    var body: some View {
        NavigationLink(value: AppRoute.vote(vote.voteId)) {
            HStack(alignment: .top, spacing: ThemeTokens.Spacing.m) {
                stance
                    .frame(width: 96, alignment: .leading)
                VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
                    Text(vote.cleanTitle)
                        .font(.display(ThemeTokens.Text.l))
                        .foregroundStyle(ThemeColor.fg)
                        .multilineTextAlignment(.leading)
                    HStack(spacing: ThemeTokens.Spacing.s) {
                        Text(Formatters.shortDate(vote.date)).kicker()
                        if let cohesion = vote.cohesion, cohesion < 0.95 {
                            Text("\(Copy.cohesion) \(Formatters.percent(cohesion))")
                                .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                                .foregroundStyle(ThemeColor.danger)
                        }
                        ResultChip(result: vote.result)
                    }
                }
                Spacer(minLength: 0)
            }
            .padding(.vertical, ThemeTokens.Spacing.m)
            .frame(maxWidth: .infinity, alignment: .leading)
            .overlay(alignment: .top) {
                Rectangle().fill(ThemeColor.border).frame(height: ThemeTokens.Stroke.s)
            }
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder private var stance: some View {
        if vote.partyVote == .mixed || vote.partyVote == .split {
            ChoicePill(label: Copy.positionMixed)
        } else {
            ChoicePill(label: vote.partyVote.label, fill: vote.partyVote.pillFill, textColor: vote.partyVote.pillText)
        }
    }
}
