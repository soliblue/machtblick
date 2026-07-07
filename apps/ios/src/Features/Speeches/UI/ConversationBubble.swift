import SwiftUI

struct ConversationBubble: View {
    let speech: SpeechSummary
    let trailing: Bool
    let maxWidth: CGFloat
    let expanded: Bool
    let onExpand: () -> Void
    @State private var fullText: String?
    @State private var loading = false

    var body: some View {
        VStack(alignment: trailing ? .trailing : .leading, spacing: ThemeTokens.Spacing.s) {
            header
            speechText
            if expanded && loading {
                ProgressView().controlSize(.small)
            }
            if !expanded && canExpand {
                Button(action: onExpand) {
                    Text(Copy.showMore)
                        .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                        .foregroundStyle(PartyStyle.color(party))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(ThemeTokens.Spacing.m)
        .frame(maxWidth: maxWidth, alignment: trailing ? .trailing : .leading)
        .background(RoundedRectangle(cornerRadius: 16).fill(tint))
        .frame(maxWidth: .infinity, alignment: trailing ? .trailing : .leading)
    }

    @ViewBuilder private var header: some View {
        let avatar = SpeakerAvatar(name: speech.speakerName, pictureUrl: speech.pictureUrl, size: 24)
        let name = Text(speech.speakerName)
            .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
            .foregroundStyle(ThemeColor.fg)
        let logo = PartyStyle.hasLogo(party) ? PartyLogo(party: party, size: ThemeTokens.Icon.s) : nil
        HStack(spacing: ThemeTokens.Spacing.s) {
            if trailing {
                logo
                name
                avatar
            } else {
                avatar
                name
                logo
            }
        }
    }

    @ViewBuilder private var speechText: some View {
        Text(expanded ? (fullText ?? speech.excerpt) : speech.excerpt)
            .font(.serif(ThemeTokens.Text.l))
            .foregroundStyle(ThemeColor.fg)
            .lineLimit(expanded ? nil : 6)
            .multilineTextAlignment(trailing ? .trailing : .leading)
            .task(id: expanded) {
                if expanded && fullText == nil {
                    loading = true
                    let text = await SpeechBodyService.shared.text(ids: [speech.id])
                    fullText = text.isEmpty ? speech.excerpt : text
                    loading = false
                }
            }
    }

    private var party: String { speech.party ?? "" }

    private var tint: Color {
        speech.party == nil ? ThemeColor.surface : PartyStyle.color(party).opacity(0.13)
    }

    private var canExpand: Bool {
        speech.contributionType != "short"
    }
}
