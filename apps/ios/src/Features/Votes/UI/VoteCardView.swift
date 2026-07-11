import Foundation
import SwiftUI

struct VoteCardView: View {
    @Environment(\.locale) private var locale

    let vote: VoteListItem
    let cache: ApiCache

    @State private var detailStore = VoteDetailStore()

    private var title: AttributedString {
        var title = AttributedString(vote.cleanTitle)
        title.languageIdentifier = locale.identifier
        return title
    }

    private var needsDetail: Bool {
        vote.summarySimplified == nil && vote.partySummaries == nil
    }

    private var summary: String? {
        vote.summarySimplified ?? detailStore.detail?.vote.summarySimplified
    }

    private var summaries: [PartyVoteSummary] {
        vote.partySummaries ?? detailStore.detail?.partySummaries.map(\.counts) ?? []
    }

    private func inlineSummary(_ markdown: String) -> AttributedString {
        (try? AttributedString(markdown: markdown, options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace)))
            ?? AttributedString(markdown)
    }

    var body: some View {
        NavigationLink(value: AppRoute.vote(vote.id)) {
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: ThemeTokens.Spacing.s) {
                    ProposerKicker(party: vote.initiator ?? Copy.unknown)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    StampView(label: vote.result.label, color: vote.result.color)
                    Text(Formatters.shortDate(vote.date))
                        .kicker()
                        .lineLimit(1)
                        .frame(maxWidth: .infinity, alignment: .trailing)
                }
                Text(title)
                    .font(.display(ThemeTokens.Text.xl))
                    .foregroundStyle(ThemeColor.fg)
                    .lineLimit(4)
                    .multilineTextAlignment(.leading)
                    .padding(.top, ThemeTokens.Spacing.m)
                if let summary {
                    GeometryReader { geo in
                        Text(inlineSummary(summary))
                            .font(.serif(ThemeTokens.Text.l))
                            .foregroundStyle(ThemeColor.fg)
                            .lineSpacing(3)
                            .lineLimit(max(1, Int(geo.size.height / 23)))
                            .truncationMode(.tail)
                            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                    }
                    .padding(.top, ThemeTokens.Spacing.m)
                }
                VoteHemicycleView(
                    yes: vote.yes, no: vote.no, abstain: vote.abstain, absent: vote.absent,
                    total: max(vote.totalMembers, 1)
                )
                .frame(maxWidth: 320)
                .frame(maxWidth: .infinity)
                if !summaries.isEmpty {
                    PartyDonutRow(summaries: summaries)
                        .padding(.top, ThemeTokens.Spacing.l)
                }
            }
            .padding(ThemeTokens.Spacing.l)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .padding(.horizontal, ThemeTokens.Spacing.m)
            .padding(.vertical, ThemeTokens.Spacing.s)
        }
        .buttonStyle(.plain)
        .task {
            if needsDetail { await detailStore.load(id: vote.id, cache: cache) }
        }
    }
}
