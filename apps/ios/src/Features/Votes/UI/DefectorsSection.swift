import SwiftUI

struct DefectorsSection: View {
    let defectors: [VoteDetailPayload.DefectorGroup]

    var body: some View {
        if !defectors.isEmpty {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
                Text(Copy.defectorsSection).kicker()
                ForEach(defectors) { group in
                    VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
                        HStack(spacing: ThemeTokens.Spacing.s) {
                            PartyBadge(party: group.party)
                            Text("\(Copy.majority): \(group.majority.label)")
                                .font(.system(size: ThemeTokens.Text.s))
                                .foregroundStyle(ThemeColor.secondary)
                            Spacer()
                        }
                        ForEach(group.members) { member in
                            NavigationLink(value: AppRoute.member(member.id)) {
                                HStack(spacing: ThemeTokens.Spacing.s) {
                                    MemberAvatar(
                                        name: member.name, url: HTTPClient.absolute(member.pictureUrl), size: 32)
                                    Text(member.name).font(.system(size: ThemeTokens.Text.m))
                                    Spacer()
                                    Text(member.choice.label)
                                        .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                                        .foregroundStyle(member.choice.color)
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(ThemeTokens.Spacing.m)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .overlay(Rectangle().strokeBorder(ThemeColor.border, lineWidth: ThemeTokens.Stroke.s))
                }
            }
        }
    }
}
