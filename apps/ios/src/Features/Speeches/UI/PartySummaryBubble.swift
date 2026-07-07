import SwiftUI

struct PartySummaryBubble: View {
    let summary: PartySummaryReader
    let onOpen: () -> Void

    var body: some View {
        Button(action: onOpen) {
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
                    .lineLimit(6)
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
                HStack(spacing: ThemeTokens.Spacing.xs) {
                    Text(Copy.readSummary)
                        .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                    Image(systemName: "chevron.right").font(.system(size: ThemeTokens.Text.s))
                }
                .foregroundStyle(PartyStyle.color(summary.party))
            }
            .padding(ThemeTokens.Spacing.m)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 16).fill(tint))
        }
        .buttonStyle(.plain)
    }

    private var tint: Color {
        PartyStyle.hasPartyLine(summary.party)
            ? PartyStyle.color(summary.party).opacity(0.13)
            : ThemeColor.surface
    }
}
