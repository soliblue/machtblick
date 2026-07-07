import SwiftUI

struct PartySummaryBubble: View {
    let summary: PartySummaryReader
    @State private var expanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
            HStack(spacing: ThemeTokens.Spacing.s) {
                if PartyStyle.hasLogo(summary.party) {
                    PartyLogo(party: summary.party, size: ThemeTokens.Icon.m)
                }
                Text(PartyStyle.label(summary.party))
                    .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                    .foregroundStyle(ThemeColor.fg)
                Spacer(minLength: 0)
                StampView(label: summary.stance.label, color: summary.stance.color)
            }
            Text(summary.positionSummary ?? "")
                .font(.serif(ThemeTokens.Text.l))
                .foregroundStyle(ThemeColor.fg)
                .lineLimit(expanded ? nil : 6)
                .multilineTextAlignment(.leading)
                .frame(maxWidth: .infinity, alignment: .leading)
            if expanded {
                if let points = summary.keyPoints {
                    MarkdownText(markdown: points, bodySize: ThemeTokens.Text.l)
                }
                if let dissent = summary.dissentNote {
                    Text(dissent)
                        .font(.system(size: ThemeTokens.Text.s))
                        .foregroundStyle(ThemeColor.secondary)
                }
                Text(Copy.aiNotice)
                    .font(.system(size: ThemeTokens.Text.s))
                    .foregroundStyle(ThemeColor.secondary)
            } else {
                Button { expanded = true } label: {
                    Text(Copy.showMore)
                        .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                        .foregroundStyle(PartyStyle.color(summary.party))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(ThemeTokens.Spacing.m)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 16).fill(tint))
    }

    private var tint: Color {
        PartyStyle.hasPartyLine(summary.party)
            ? PartyStyle.color(summary.party).opacity(0.13)
            : ThemeColor.surface
    }
}
