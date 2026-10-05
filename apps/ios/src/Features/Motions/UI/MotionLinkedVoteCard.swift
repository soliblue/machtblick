import SwiftUI

struct MotionLinkedVoteCard: View {
    let vote: MotionDetailPayload.LinkedVote
    var detail: VoteDetailPayload? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.l) {
            NavigationLink(value: AppRoute.vote(vote.id)) {
                HStack(alignment: .top, spacing: ThemeTokens.Spacing.m) {
                    VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
                        Text("\(Formatters.shortDate(vote.date)) · \(voteTypeLabel)").kicker()
                        Text(vote.cleanTitle)
                            .font(.display(ThemeTokens.Text.l))
                            .foregroundStyle(ThemeColor.fg)
                            .multilineTextAlignment(.leading)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    StampView(label: vote.result.label, color: vote.result.color)
                }
                .padding(ThemeTokens.Spacing.m)
                .background(ThemeColor.surface, in: RoundedRectangle(cornerRadius: ThemeTokens.Radius.m))
            }
            .buttonStyle(.plain)
            .accessibilityIdentifier("motion-linked-vote-header-\(vote.id)")
            VoteResultTable(model: detail.map { VoteResultsModel(detail: $0) } ?? VoteResultsModel(vote: vote))
        }
        .accessibilityIdentifier("motion-linked-vote-\(vote.id)")
    }

    private var voteTypeLabel: String {
        switch vote.voteType {
        case "namentlich": return Copy.namedVote
        case "handzeichen": return Copy.showOfHands
        default: return vote.voteType
        }
    }
}
