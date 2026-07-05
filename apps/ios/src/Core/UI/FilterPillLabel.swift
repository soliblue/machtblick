import SwiftUI

struct FilterPillLabel: View {
    let name: String
    let value: String?

    var body: some View {
        HStack(spacing: ThemeTokens.Spacing.xs) {
            Text(value ?? name)
                .font(.system(size: ThemeTokens.Text.m, weight: value == nil ? .regular : .semibold))
                .foregroundStyle(value == nil ? ThemeColor.secondary : ThemeColor.fg)
            Image(systemName: "chevron.down").font(.system(size: 10))
                .foregroundStyle(ThemeColor.secondary)
        }
        .padding(.horizontal, ThemeTokens.Spacing.m)
        .padding(.vertical, ThemeTokens.Spacing.xs)
        .overlay(Rectangle().strokeBorder(ThemeColor.border, lineWidth: ThemeTokens.Stroke.s))
    }
}
