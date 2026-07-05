import SwiftUI

struct VoteCardView: View {
    let vote: VoteListItem
    let cache: ApiCache
    @State private var detailStore = VoteDetailStore()

    private var needsDetail: Bool {
        vote.summarySimplified == nil && vote.partySummaries == nil
    }

    private var summary: String? {
        vote.summarySimplified ?? detailStore.detail?.vote.summarySimplified
    }

    private var summaries: [PartyVoteSummary] {
        vote.partySummaries ?? detailStore.detail?.partySummaries.map(\.counts) ?? []
    }

    var body: some View {
        NavigationLink(value: AppRoute.vote(vote.id)) {
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: ThemeTokens.Spacing.s) {
                    PartyBadge(party: vote.initiator ?? Copy.unknown)
                    Spacer()
                    StampView(label: vote.result.label, color: vote.result.color)
                    Spacer()
                    Text(Formatters.shortDate(vote.date)).kicker()
                }
                Text(vote.cleanTitle)
                    .font(.display(ThemeTokens.Text.xl))
                    .foregroundStyle(ThemeColor.fg)
                    .lineLimit(4)
                    .multilineTextAlignment(.leading)
                    .padding(.top, ThemeTokens.Spacing.m)
                if let summary {
                    MarkdownText(markdown: summary)
                        .foregroundStyle(ThemeColor.fg)
                        .lineLimit(7)
                        .padding(.top, ThemeTokens.Spacing.m)
                }
                Spacer(minLength: ThemeTokens.Spacing.m)
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
            .overlay(Rectangle().strokeBorder(ThemeColor.border, lineWidth: ThemeTokens.Stroke.s))
            .padding(.horizontal, ThemeTokens.Spacing.m)
            .padding(.vertical, ThemeTokens.Spacing.s)
        }
        .buttonStyle(.plain)
        .task {
            if needsDetail { await detailStore.load(id: vote.id, cache: cache) }
        }
    }
}
