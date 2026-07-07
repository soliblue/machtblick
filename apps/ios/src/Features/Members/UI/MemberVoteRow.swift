import SwiftUI

struct MemberVoteRow: View {
    let entry: MemberDetailPayload.HistoryEntry
    var showDivider = true

    var body: some View {
        NavigationLink(value: AppRoute.vote(entry.voteId)) {
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
                    Spacer(minLength: ThemeTokens.Spacing.s)
                    StampView(label: entry.choice.label, color: choiceColor)
                }
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

    private var choiceColor: Color {
        switch entry.choice {
        case .ja: return ThemeColor.success
        case .nein: return ThemeColor.danger
        case .enthalten: return ThemeColor.yellow
        default: return ThemeColor.fg
        }
    }

    private var majorityLabel: String {
        BallotChoice(rawValue: entry.partyMajority)?.label ?? entry.partyMajority
    }
}
