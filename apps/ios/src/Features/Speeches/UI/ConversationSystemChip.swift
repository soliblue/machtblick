import SwiftUI

struct ConversationSystemChip: View {
    let speech: SpeechSummary

    var body: some View {
        HStack {
            Spacer(minLength: 0)
            (Text(speech.speakerName).font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                + Text(" · \(speech.excerpt)").font(.system(size: ThemeTokens.Text.s)))
                .foregroundStyle(ThemeColor.secondary)
                .multilineTextAlignment(.center)
                .lineLimit(3)
                .padding(.horizontal, ThemeTokens.Spacing.m)
                .padding(.vertical, ThemeTokens.Spacing.s)
                .background(Capsule().fill(ThemeColor.surface))
            Spacer(minLength: 0)
        }
        .padding(.horizontal, ThemeTokens.Spacing.xl)
    }
}
