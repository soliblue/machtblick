import SwiftUI

struct DefectorRow: View {
    let member: VoteDetailPayload.DefectorMember
    var showDivider = true

    var body: some View {
        NavigationLink(value: AppRoute.member(member.id)) {
            HStack(spacing: ThemeTokens.Spacing.m) {
                MemberAvatar(name: member.name, url: HTTPClient.absolute(member.pictureUrl), size: 32)
                Text(member.name)
                    .font(.system(size: ThemeTokens.Text.m))
                    .foregroundStyle(ThemeColor.fg)
                Spacer(minLength: ThemeTokens.Spacing.s)
                StampView(label: member.choice.label, color: member.choice.color)
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
