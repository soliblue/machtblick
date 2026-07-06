import SwiftUI

struct AntragSignatoryStrip: View {
    let signatories: [MotionDetailPayload.Signatory]
    private let cap = 8

    private var visible: [MotionDetailPayload.Signatory] { Array(signatories.prefix(cap)) }
    private var overflow: Int { max(0, signatories.count - cap) }

    var body: some View {
        if !signatories.isEmpty {
            HStack(spacing: ThemeTokens.Spacing.s) {
                Text(Copy.broughtBy)
                    .font(.system(size: ThemeTokens.Text.m))
                    .foregroundStyle(ThemeColor.secondary)
                HStack(spacing: -10) {
                    ForEach(Array(visible.enumerated()), id: \.element.id) { index, member in
                        NavigationLink(value: AppRoute.member(member.memberId)) {
                            MemberAvatar(
                                name: member.displayName,
                                url: HTTPClient.absolute(member.portraitUrl), size: 32, circle: true)
                            .overlay(Circle().strokeBorder(ThemeColor.background, lineWidth: 1.5))
                        }
                        .buttonStyle(.plain)
                        .zIndex(Double(visible.count - index))
                    }
                    if overflow > 0 {
                        Text("+\(overflow)")
                            .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                            .foregroundStyle(ThemeColor.secondary)
                            .frame(width: 32, height: 32)
                            .background(Circle().fill(ThemeColor.surface))
                            .overlay(Circle().strokeBorder(ThemeColor.background, lineWidth: 1.5))
                    }
                }
            }
        }
    }
}
