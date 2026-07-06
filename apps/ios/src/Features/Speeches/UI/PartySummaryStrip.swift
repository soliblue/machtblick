import SwiftUI

struct PartySummaryStrip: View {
    let summaries: [PartySummaryReader]
    let onOpen: (Int) -> Void

    var body: some View {
        if !summaries.isEmpty {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
                Text("\(Copy.partySummariesTitle) · \(summaries.count)").kicker()
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(alignment: .top, spacing: ThemeTokens.Spacing.m) {
                        ForEach(Array(summaries.enumerated()), id: \.element.id) { index, summary in
                            if index > 0 {
                                Rectangle()
                                    .fill(ThemeColor.border)
                                    .frame(width: ThemeTokens.Stroke.s)
                            }
                            card(summary, index: index)
                        }
                    }
                }
                .edgeToEdgeScroll()
            }
        }
    }

    private func card(_ summary: PartySummaryReader, index: Int) -> some View {
        Button(action: { onOpen(index) }) {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
                HStack {
                    if PartyStyle.hasLogo(summary.party) {
                        PartyLogo(party: summary.party, size: ThemeTokens.Icon.l)
                    } else {
                        Text(PartyStyle.label(summary.party))
                            .font(.system(size: ThemeTokens.Text.m, weight: .semibold))
                            .foregroundStyle(PartyStyle.color(summary.party))
                    }
                    Spacer()
                    StampView(label: summary.stance.label, color: summary.stance.color)
                }
                Text(summary.positionSummary ?? "")
                    .font(.serif(ThemeTokens.Text.m))
                    .foregroundStyle(ThemeColor.fg)
                    .lineLimit(5)
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
                HStack(spacing: ThemeTokens.Spacing.xs) {
                    Text(Copy.readSummary).font(.system(size: ThemeTokens.Text.s))
                    Image(systemName: "chevron.right").font(.system(size: ThemeTokens.Text.s))
                }
                .foregroundStyle(ThemeColor.secondary)
            }
            .padding(ThemeTokens.Spacing.l)
            .frame(width: 240, alignment: .topLeading)
        }
        .buttonStyle(.plain)
    }
}
