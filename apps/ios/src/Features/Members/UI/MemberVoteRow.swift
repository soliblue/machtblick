import SwiftUI

struct MemberVoteRow: View {
    let entry: MemberDetailPayload.HistoryEntry

    var body: some View {
        NavigationLink(value: AppRoute.vote(entry.voteId)) {
            HStack(alignment: .top, spacing: ThemeTokens.Spacing.m) {
                choice
                    .frame(width: 96, alignment: .leading)
                VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
                    Text(entry.cleanTitle)
                        .font(.display(ThemeTokens.Text.l))
                        .foregroundStyle(ThemeColor.fg)
                        .multilineTextAlignment(.leading)
                    HStack(spacing: ThemeTokens.Spacing.s) {
                        Text(Formatters.shortDate(entry.date)).kicker()
                        if entry.defected == true {
                            Text("\(Copy.deviatedFromLine) \(majorityLabel)")
                                .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                                .foregroundStyle(ThemeColor.danger)
                        }
                        ResultChip(result: entry.result)
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

    @ViewBuilder private var choice: some View {
        if entry.choice == .nichtAbgegeben {
            Text(Copy.notCast)
                .tracking(0.9)
                .font(.system(size: 11, weight: .semibold))
                .textCase(.uppercase)
                .foregroundStyle(ThemeColor.fg.opacity(ThemeTokens.Opacity.m))
        } else {
            ChoicePill(label: entry.choice.label, fill: entry.choice.pillFill, textColor: entry.choice.pillText)
        }
    }

    private var majorityLabel: String {
        BallotChoice(rawValue: entry.partyMajority)?.label ?? entry.partyMajority
    }
}
