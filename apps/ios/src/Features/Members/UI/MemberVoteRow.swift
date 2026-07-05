import SwiftUI

struct MemberVoteRow: View {
    let entry: MemberDetailPayload.HistoryEntry

    var body: some View {
        NavigationLink(value: AppRoute.vote(entry.voteId)) {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
                HStack(spacing: ThemeTokens.Spacing.s) {
                    Text(entry.choice.label)
                        .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                        .foregroundStyle(entry.choice.color)
                        .padding(.horizontal, ThemeTokens.Spacing.s)
                        .padding(.vertical, ThemeTokens.Spacing.xs)
                        .background(entry.choice.color.opacity(0.15))
                    if entry.defected == true {
                        Text(Copy.defectorsSection)
                            .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                            .foregroundStyle(ThemeColor.danger)
                    }
                    Spacer()
                    Text(Formatters.shortDate(entry.date)).kicker()
                }
                Text(entry.cleanTitle)
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
