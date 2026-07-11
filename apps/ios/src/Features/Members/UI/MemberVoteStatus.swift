import SwiftUI

struct MemberVoteStatus: View {
    let entry: MemberDetailPayload.HistoryEntry

    var body: some View {
        HStack(spacing: ThemeTokens.Spacing.s) {
            Text(Copy.voteLabel).kicker()
            MemberBallotBadge(choice: entry.choice)
            if entry.showsLineStatus {
                Text("·")
                    .foregroundStyle(ThemeColor.secondary)
                Group {
                    if entry.defected == true {
                        Text(Copy.deviation)
                    } else {
                        Text(Copy.line)
                    }
                }
                .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                .textCase(.uppercase)
                .foregroundStyle(entry.defected == true ? ThemeColor.danger : ThemeColor.success)
            }
        }
        .padding(.horizontal, ThemeTokens.Spacing.s)
        .padding(.vertical, ThemeTokens.Spacing.xs)
        .frame(maxWidth: .infinity)
        .background(ThemeColor.background)
        .anchorPreference(
            key: PartyDonutConnectorPreferenceKey.self,
            value: .bottom
        ) { anchor in
            PartyDonutConnectorAnchors(status: anchor)
        }
    }
}
