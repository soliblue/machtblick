import SwiftUI

struct ConversationBubble: View {
    let speech: SpeechSummary
    let trailing: Bool
    let maxWidth: CGFloat
    let expanded: Bool
    var highlight: Bool = false
    var terms: [String] = []
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
        .overlay {
            if highlight {
                RoundedRectangle(cornerRadius: 16)
                    .stroke(ring, lineWidth: ThemeTokens.Stroke.m)
            }
        }
        .frame(maxWidth: .infinity, alignment: trailing ? .trailing : .leading)
    }

    @ViewBuilder private var header: some View {
        HStack(spacing: ThemeTokens.Spacing.s) {
            identity
            Spacer(minLength: ThemeTokens.Spacing.s)
            logo
        }
    }

    @ViewBuilder private var identity: some View {
        if let memberId = speech.speakerMemberId {
            NavigationLink(value: AppRoute.member(memberId)) { identityContent }
                .buttonStyle(.plain)
        } else {
            identityContent
        }
    }

    @ViewBuilder private var identityContent: some View {
        let avatar = SpeakerAvatar(name: speech.speakerName, pictureUrl: speech.pictureUrl, size: 24)
        let name = Text(speech.speakerName)
            .font(.system(size: ThemeTokens.Text.l, weight: .semibold))
            .foregroundStyle(ThemeColor.fg)
        HStack(spacing: ThemeTokens.Spacing.s) {
            if trailing {
                name
                avatar
            } else {
                avatar
                name
            }
        }
    }

    @ViewBuilder private var logo: some View {
        if PartyStyle.hasLogo(party) {
            PartyLogo(party: party, size: ThemeTokens.Icon.s)
        }
    }

    @ViewBuilder private var speechText: some View {
        Text(displayText)
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

    private var displayText: AttributedString {
        let raw = expanded ? (fullText ?? speech.excerpt) : speech.excerpt
        let shown = (!expanded && !terms.isEmpty) ? matchSnippet(raw, terms: terms) : raw
        return highlighted(shown, terms: terms)
    }

    private var party: String { speech.party ?? "" }

    private var tint: Color {
        speech.party == nil
            ? (highlight ? ThemeColor.elevated : ThemeColor.surface)
            : PartyStyle.color(party).opacity(highlight ? 0.22 : 0.13)
    }

    private var ring: Color {
        speech.party == nil
            ? ThemeColor.fg.opacity(ThemeTokens.Opacity.m)
            : PartyStyle.color(party).opacity(ThemeTokens.Opacity.l)
    }

    private var canExpand: Bool {
        speech.contributionType != "short"
    }
}
