import SwiftUI

struct MotionLinkedVoteCard: View {
    let vote: MotionDetailPayload.LinkedVote

    var body: some View {
        NavigationLink(value: AppRoute.vote(vote.id)) {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
                HStack {
                    ChoicePill(label: vote.result.label, fill: vote.result.color)
                    Spacer()
                    Text("\(Formatters.shortDate(vote.date)) · \(voteTypeLabel)").kicker()
                }
                Text(vote.cleanTitle)
                    .font(.display(ThemeTokens.Text.l))
                    .foregroundStyle(ThemeColor.fg)
                    .multilineTextAlignment(.leading)
                if let total = vote.totalMembers, total > 0 {
                    VoteHemicycleView(
                        yes: vote.yes ?? 0, no: vote.no ?? 0, abstain: vote.abstain ?? 0,
                        absent: vote.absent ?? 0, total: total
                    )
                    .frame(maxWidth: 440)
                    .frame(maxWidth: .infinity)
                    VoteDonutView(
                        yes: vote.yes ?? 0, no: vote.no ?? 0, abstain: vote.abstain ?? 0, absent: vote.absent ?? 0
                    )
                    .frame(width: 132, height: 132)
                    .frame(maxWidth: .infinity)
                }
            }
            .padding(ThemeTokens.Spacing.l)
            .frame(maxWidth: .infinity, alignment: .leading)
            .overlay(alignment: .top) { Rectangle().fill(vote.result.color).frame(height: 3) }
            .overlay(Rectangle().strokeBorder(ThemeColor.border, lineWidth: ThemeTokens.Stroke.s))
        }
        .buttonStyle(.plain)
    }

    private var voteTypeLabel: String {
        switch vote.voteType {
        case "namentlich": return Copy.namedVote
        case "handzeichen": return Copy.showOfHands
        default: return vote.voteType
        }
    }
}
