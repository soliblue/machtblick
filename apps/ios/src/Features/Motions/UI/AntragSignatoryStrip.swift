import SwiftUI

struct AntragSignatoryStrip: View {
    let signatories: [MotionDetailPayload.Signatory]

    var body: some View {
        if !signatories.isEmpty {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
                Text(Copy.broughtBy).kicker()
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: ThemeTokens.Spacing.s) {
                        ForEach(signatories) { member in
                            NavigationLink(value: AppRoute.member(member.memberId)) {
                                VStack(spacing: ThemeTokens.Spacing.xs) {
                                    MemberAvatar(
                                        name: member.displayName,
                                        url: HTTPClient.absolute(member.portraitUrl), size: 48, circle: true)
                                    Text(member.displayName)
                                        .font(.system(size: 9))
                                        .foregroundStyle(ThemeColor.secondary)
                                        .lineLimit(1)
                                }
                                .frame(width: 72)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .edgeToEdgeScroll()
            }
        }
    }
}
