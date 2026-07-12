import SwiftUI

struct MoreRowLabel: View {
    let title: String
    let systemImage: String

    var body: some View {
        HStack(spacing: ThemeTokens.Spacing.m) {
            Image(systemName: systemImage)
                .font(.system(size: ThemeTokens.Icon.m))
                .frame(width: ThemeTokens.Icon.l)
            Text(title)
                .font(.system(size: ThemeTokens.Text.l))
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: ThemeTokens.Icon.s))
                .foregroundStyle(ThemeColor.secondary)
        }
        .foregroundStyle(ThemeColor.fg)
        .padding(.vertical, ThemeTokens.Spacing.l)
        .contentShape(Rectangle())
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(title)
    }
}
