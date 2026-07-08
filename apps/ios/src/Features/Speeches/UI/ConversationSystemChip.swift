import SwiftUI

struct ConversationSystemChip: View {
    let speech: SpeechSummary

    var body: some View {
        HStack(spacing: ThemeTokens.Spacing.m) {
            rule
            VStack(spacing: 2) {
                Text(speech.speakerName)
                    .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                Text(speech.excerpt)
                    .font(.system(size: ThemeTokens.Text.s))
            }
            .foregroundStyle(ThemeColor.secondary)
            .multilineTextAlignment(.center)
            .lineLimit(3)
            .fixedSize(horizontal: false, vertical: true)
            .layoutPriority(1)
            rule
        }
        .padding(.horizontal, -ThemeTokens.Spacing.l)
        .padding(.vertical, ThemeTokens.Spacing.s)
    }

    private var rule: some View {
        Rectangle()
            .fill(ThemeColor.border)
            .frame(height: ThemeTokens.Stroke.s)
            .frame(maxWidth: .infinity)
    }
}
