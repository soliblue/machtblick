import Foundation
import SwiftUI

struct MemberVoteCard: View {
    @Environment(\.locale) private var locale

    let entry: MemberDetailPayload.HistoryEntry

    private var title: AttributedString {
        var title = AttributedString(entry.cleanTitle)
        title.languageIdentifier = locale.identifier
        return title
    }

    private var accessibilityText: String {
        var parts = [
            entry.cleanTitle,
            "\(Copy.voteLabel): \(entry.choice.label)",
            entry.result.label,
        ]
        if entry.showsLineStatus {
            parts.append(entry.defected == true ? Copy.deviatedFromLine : Copy.line)
        }
        return parts.joined(separator: ", ")
    }

    var body: some View {
        NavigationLink(value: AppRoute.vote(entry.voteId)) {
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: ThemeTokens.Spacing.s) {
                    if let proposingParty = entry.proposingParty {
                        ProposerKicker(party: proposingParty)
                    }
                    Spacer(minLength: ThemeTokens.Spacing.s)
                    StampView(label: entry.result.label, color: entry.result.color)
                }
                Text(title)
                    .font(.display(ThemeTokens.Text.xl))
                    .foregroundStyle(ThemeColor.fg)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, ThemeTokens.Spacing.m)
                MemberVoteRelation(entry: entry)
                    .padding(.top, ThemeTokens.Spacing.m)
            }
            .padding(ThemeTokens.Spacing.l)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(ThemeColor.background)
            .contentShape(Rectangle())
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(accessibilityText)
        }
        .buttonStyle(.plain)
    }
}
