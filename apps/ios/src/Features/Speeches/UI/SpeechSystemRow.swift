import SwiftUI

struct SpeechSystemRow: View {
    let speech: SpeechSummary

    var body: some View {
        HStack(alignment: .top, spacing: ThemeTokens.Spacing.m) {
            ZStack {
                Circle().fill(ThemeColor.background).frame(width: 36, height: 36)
                Circle()
                    .fill(ThemeColor.elevated)
                    .overlay(Circle().strokeBorder(ThemeColor.border, lineWidth: ThemeTokens.Stroke.s))
                    .frame(width: 7, height: 7)
            }
            (Text(speech.speakerName).font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                + Text(" · \(speech.excerpt)").font(.system(size: ThemeTokens.Text.s)))
                .foregroundStyle(ThemeColor.secondary)
                .lineLimit(2)
                .multilineTextAlignment(.leading)
                .padding(.top, ThemeTokens.Spacing.s)
            Spacer(minLength: 0)
        }
        .padding(.top, ThemeTokens.Spacing.m)
    }
}
