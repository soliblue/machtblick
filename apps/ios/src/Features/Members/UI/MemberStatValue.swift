import SwiftUI

struct MemberStatValue: View {
    let label: String
    let value: String
    let supportingText: String
    var danger = false

    var body: some View {
        VStack(spacing: ThemeTokens.Spacing.xs) {
            Text(value)
                .font(.display(ThemeTokens.Display.poster))
                .monospacedDigit()
                .foregroundStyle(ThemeColor.fg)
                .lineLimit(1)
            Text(label).kicker()
            Text(supportingText)
                .font(.system(size: ThemeTokens.Text.s, weight: danger ? .semibold : .regular))
                .foregroundStyle(danger ? ThemeColor.danger : ThemeColor.secondary)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity)
        .multilineTextAlignment(.center)
    }
}
