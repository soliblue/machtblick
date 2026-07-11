import SwiftUI

struct MoreHeaderView: View {
    var body: some View {
        VStack(spacing: ThemeTokens.Spacing.m) {
            HStack(spacing: ThemeTokens.Spacing.s) {
                EyesLogo(height: ThemeTokens.Icon.xl)
                Text("MACHTBLICK")
                    .font(.display(ThemeTokens.Text.xl))
                    .tracking(1.4)
            }
            Text(Copy.moreTagline)
                .font(.display(ThemeTokens.Text.xl))
                .multilineTextAlignment(.center)
            Text(Copy.moreDescription)
                .font(.serif(ThemeTokens.Text.m))
                .foregroundStyle(ThemeColor.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, ThemeTokens.Spacing.l)
        .accessibilityElement(children: .combine)
    }
}
