import SwiftUI

struct DefectorRow: View {
    let member: VoteDetailPayload.DefectorMember
    let party: String
    let majority: BallotChoice
    var showDivider = true

    var body: some View {
        NavigationLink(value: AppRoute.member(member.id)) {
            HStack(spacing: ThemeTokens.Spacing.m) {
                MemberAvatar(name: member.name, url: HTTPClient.absolute(member.pictureUrl), size: 40, circle: true)
                VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
                    Text(member.name)
                        .font(.system(size: ThemeTokens.Text.m, weight: .semibold))
                        .foregroundStyle(ThemeColor.fg)
                    HStack(spacing: ThemeTokens.Spacing.xs) {
                        if PartyStyle.hasLogo(party) {
                            PartyLogo(party: party, size: ThemeTokens.Icon.s)
                        }
                        Text("\(Copy.majority): \(majority.label)").kicker()
                    }
                }
                Spacer(minLength: ThemeTokens.Spacing.s)
                ChoicePill(label: member.choice.label, fill: member.choice.pillFill, textColor: member.choice.pillText)
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
