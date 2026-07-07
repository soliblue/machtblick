import SwiftUI

struct CompactTurnRow: View {
    let speech: SpeechSummary
    var terms: [String] = []
    let onOpen: () -> Void

    var body: some View {
        Button(action: onOpen) {
            HStack(alignment: .top, spacing: ThemeTokens.Spacing.m) {
                SpeakerAvatar(name: speech.speakerName, pictureUrl: speech.pictureUrl, size: 28)
                    .padding(.leading, ThemeTokens.Spacing.xs)
                (Text(speech.lastName).font(.system(size: ThemeTokens.Text.m, weight: .semibold))
                    .foregroundStyle(ThemeColor.fg)
                    + Text(" · ").font(.system(size: ThemeTokens.Text.m)).foregroundStyle(ThemeColor.secondary)
                    + Text(highlighted(speech.excerpt, terms: terms)).font(.serif(ThemeTokens.Text.m)).foregroundStyle(ThemeColor.fg))
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                Spacer(minLength: 0)
            }
            .padding(.top, ThemeTokens.Spacing.l)
        }
        .buttonStyle(.plain)
    }
}
