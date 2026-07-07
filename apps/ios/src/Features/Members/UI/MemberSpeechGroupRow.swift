import SwiftUI

struct MemberSpeechGroupRow: View {
    let group: MemberSpeechGroup
    let expanded: Bool
    var terms: [String] = []
    let onToggle: () -> Void
    let onOpen: ([SpeechSummary], Int) -> Void
    var showDivider = true

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
            Button(action: onToggle) {
                HStack(alignment: .top, spacing: ThemeTokens.Spacing.s) {
                    VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
                        Text(group.title)
                            .font(.display(ThemeTokens.Text.l))
                            .foregroundStyle(ThemeColor.fg)
                            .multilineTextAlignment(.leading)
                        Text(meta).kicker()
                    }
                    Spacer(minLength: 0)
                    Image(systemName: "chevron.down")
                        .font(.system(size: ThemeTokens.Icon.m))
                        .foregroundStyle(ThemeColor.secondary)
                        .rotationEffect(.degrees(expanded ? 180 : 0))
                }
            }
            .buttonStyle(.plain)
            if expanded {
                DebateThreadView(rows: rows, terms: terms) { onOpen(turns, $0) }
            } else {
                Text(highlighted(group.main.excerpt, terms: terms))
                    .font(.serif(ThemeTokens.Text.m))
                    .foregroundStyle(ThemeColor.secondary)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
            }
        }
        .padding(.vertical, ThemeTokens.Spacing.m)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(alignment: .top) {
            if showDivider {
                Rectangle().fill(ThemeColor.border).frame(height: ThemeTokens.Stroke.s)
            }
        }
    }

    private var meta: String {
        var parts = [Formatters.shortDate(group.date)]
        parts.append("\(group.speeches.count) \(group.speeches.count == 1 ? Copy.contribution : Copy.contributions)")
        if group.shortCount > 0 { parts.append("\(group.shortCount) \(Copy.shortSuffix)") }
        return parts.joined(separator: " · ")
    }

    private var summaries: [SpeechSummary] {
        MemberSpeechGrouping.summaries(group.speeches)
    }

    private var rows: [DebateThreadRow] {
        DebateThreadBuilder.rows(from: summaries)
    }

    private var turns: [SpeechSummary] {
        rows.compactMap { if case .turn(let speech, _, _, _) = $0 { return speech } else { return nil } }
    }
}
