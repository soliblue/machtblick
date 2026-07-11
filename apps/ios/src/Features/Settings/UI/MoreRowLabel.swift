import SwiftUI

struct MoreRowLabel: View {
    let title: String
    let systemImage: String

    var body: some View {
        HStack(spacing: ThemeTokens.Spacing.m) {
            Image(systemName: systemImage)
                .frame(width: ThemeTokens.Icon.l)
            Text(title)
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: ThemeTokens.Icon.s))
                .foregroundStyle(ThemeColor.secondary)
        }
        .foregroundStyle(ThemeColor.fg)
        .contentShape(Rectangle())
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(title)
    }
}
