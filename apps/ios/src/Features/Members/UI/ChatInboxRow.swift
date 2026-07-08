import SwiftUI

struct ChatInboxRow: View {
    let group: MemberSpeechGroup
    var showDivider = true
    let onOpen: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
            Text(group.title)
                .font(.display(ThemeTokens.Text.l))
                .foregroundStyle(ThemeColor.fg)
                .multilineTextAlignment(.leading)
            Text(group.main.excerpt)
                .font(.serif(ThemeTokens.Text.l))
                .foregroundStyle(ThemeColor.fg)
                .lineLimit(3)
                .multilineTextAlignment(.leading)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(ThemeTokens.Spacing.m)
                .background(RoundedRectangle(cornerRadius: 16).fill(tint))
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

    private var tint: Color {
        let party = group.main.party ?? ""
        return PartyStyle.hasPartyLine(party) ? PartyStyle.color(party).opacity(0.13) : ThemeColor.surface
    }

    private var accent: Color {
        let party = group.main.party ?? ""
        return PartyStyle.hasPartyLine(party) ? PartyStyle.color(party) : ThemeColor.fg
    }
}
