import SwiftUI

struct ErrorStateView: View {
    let message: String
    let retry: () -> Void

    var body: some View {
        VStack(spacing: ThemeTokens.Spacing.m) {
            Text(message)
                .font(.system(size: ThemeTokens.Text.m))
                .foregroundStyle(ThemeColor.secondary)
                .multilineTextAlignment(.center)
            Button(Copy.retry, action: retry)
                .font(.system(size: ThemeTokens.Text.m, weight: .semibold))
                .foregroundStyle(ThemeColor.fg)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(ThemeTokens.Spacing.xl)
    }
}
