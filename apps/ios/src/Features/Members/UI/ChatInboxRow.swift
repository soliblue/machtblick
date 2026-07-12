import SwiftUI

struct ChatInboxRow: View {
    let group: MemberSpeechGroup
    var showDivider = true
    var terms: [String] = []
    let onOpen: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
            Text(highlighted(group.title, terms: terms))
                .font(.display(ThemeTokens.Text.l))
                .foregroundStyle(ThemeColor.fg)
                .multilineTextAlignment(.leading)
            Text(excerpt)
                .font(.serif(ThemeTokens.Text.l))
                .foregroundStyle(ThemeColor.fg)
                .lineLimit(3)
                .multilineTextAlignment(.leading)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(ThemeTokens.Spacing.m)
                .background(PartySurface(party: PartyStyle.hasPartyLine(party) ? party : nil))
            Button(action: onOpen) {
                HStack(spacing: ThemeTokens.Spacing.xs) {
                    Text(Copy.viewFullDebate)
                        .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                    Image(systemName: "chevron.right").font(.system(size: ThemeTokens.Text.s))
                }
                .foregroundStyle(accent)
            }
            .buttonStyle(.plain)
        }
        .padding(.vertical, ThemeTokens.Spacing.m)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(alignment: .top) {
            if showDivider {
                Rectangle().fill(ThemeColor.border).frame(height: ThemeTokens.Stroke.s)
            }
        }
    }

    private var excerpt: AttributedString {
        guard !terms.isEmpty else { return AttributedString(group.main.excerpt) }
        let source = group.speeches.first { speech in
            terms.contains { speech.excerpt.range(of: $0, options: .caseInsensitive) != nil }
        }?.excerpt ?? group.main.excerpt
        return highlighted(matchSnippet(source, terms: terms), terms: terms)
    }

    private var party: String { group.main.party ?? "" }

    private var accent: Color {
        return PartyStyle.hasPartyLine(party) ? PartyStyle.color(party) : ThemeColor.fg
    }
}
