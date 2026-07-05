import SwiftUI

struct MemberSpeechRow: View {
    let speech: MemberDetailPayload.SpeechEntry

    var body: some View {
        if let voteId = speech.voteId {
            NavigationLink(value: AppRoute.vote(voteId)) {
                content
            }
            .buttonStyle(.plain)
        } else {
            content
        }
    }

    private var content: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
            HStack {
                Text(speech.voteTitle ?? speech.agendaTitle ?? Copy.speechesSection)
                    .font(.system(size: ThemeTokens.Text.m, weight: .semibold))
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                Spacer()
                Text(Formatters.shortDate(speech.date)).kicker()
            }
            Text(speech.excerpt)
                .font(.serif(ThemeTokens.Text.m))
                .foregroundStyle(ThemeColor.fg)
                .lineLimit(4)
                .multilineTextAlignment(.leading)
        }
        .padding(.vertical, ThemeTokens.Spacing.s)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(alignment: .bottom) {
            Rectangle().fill(ThemeColor.border).frame(height: ThemeTokens.Stroke.s)
        }
    }
}
