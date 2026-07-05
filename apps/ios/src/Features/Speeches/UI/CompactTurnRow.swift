import SwiftUI

struct CompactTurnRow: View {
    let speech: SpeechSummary
    let onOpen: () -> Void

    var body: some View {
        Button(action: onOpen) {
            HStack(alignment: .top, spacing: ThemeTokens.Spacing.m) {
                SpeakerAvatar(name: speech.speakerName, pictureUrl: speech.pictureUrl, size: 28)
                    .padding(.leading, 4)
                (Text(speech.lastName).font(.system(size: ThemeTokens.Text.m, weight: .semibold))
                    .foregroundStyle(ThemeColor.fg)
                    + Text(" · ").font(.system(size: ThemeTokens.Text.m)).foregroundStyle(ThemeColor.secondary)
                    + Text(speech.excerpt).font(.serif(ThemeTokens.Text.m)).foregroundStyle(ThemeColor.fg))
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                Spacer(minLength: 0)
            }
            .padding(.top, ThemeTokens.Spacing.l)
        }
        .buttonStyle(.plain)
    }
}
