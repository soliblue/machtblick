import SwiftUI

struct PartyVoteRow: View {
    let vote: PartyDetailPayload.VoteEntry
    var showDivider = true

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
                if showDivider {
                    Rectangle().fill(ThemeColor.border).frame(height: ThemeTokens.Stroke.s)
                }
            }
        }
        .buttonStyle(.plain)
    }

    private var stanceLabel: String {
        (vote.partyVote == .mixed || vote.partyVote == .split) ? Copy.positionMixed : vote.partyVote.label
    }

    private var stanceColor: Color {
        switch vote.partyVote {
        case .yes: return ThemeColor.success
        case .no: return ThemeColor.danger
        case .abstain: return ThemeColor.yellow
        default: return ThemeColor.fg
        }
    }

    private var stance: some View {
        StampView(label: stanceLabel, color: stanceColor)
    }
}
