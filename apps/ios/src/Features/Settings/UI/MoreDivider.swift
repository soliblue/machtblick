import SwiftUI

struct MoreDivider: View {
    var body: some View {
        Rectangle()
            .fill(ThemeColor.border)
            .frame(height: ThemeTokens.Stroke.s)
            .padding(.leading, ThemeTokens.Icon.l + ThemeTokens.Spacing.m)
    }
}
