import SwiftUI

struct VoteDetailView: View {
    let id: String
    let cache: ApiCache
    @State private var store = VoteDetailStore()

    var body: some View {
        Group {
            if let detail = store.detail {
                ScrollView {
                    VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xl) {
                        header(detail)
                        VoteHemicycleView(
                            yes: detail.vote.yes, no: detail.vote.no, abstain: detail.vote.abstain,
                            absent: detail.vote.absent, total: max(detail.vote.totalMembers, 1), hero: true
                        )
                        .frame(maxWidth: 440)
                        .frame(maxWidth: .infinity)
                        VoteDonutGrid(summaries: detail.partySummaries)
                        summary(detail)
                        PartySummarySection(summaries: detail.partySummaries)
                        DefectorsSection(defectors: detail.defectors)
                        DebateSection(debate: detail.debate)
                        VoteDocumentsSection(
                            documents: detail.documents, antragPdfUrl: detail.antragPdfUrl,
                            sourceUrl: detail.vote.sourceUrl)
                    }
                    .padding(ThemeTokens.Spacing.l)
                }
            } else {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .background(ThemeColor.background)
        .navigationBarTitleDisplayMode(.inline)
        .task { await store.load(id: id, cache: cache) }
    }

    private func header(_ detail: VoteDetailPayload) -> some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
            HStack(spacing: ThemeTokens.Spacing.s) {
                PartyBadge(party: detail.proposingParty ?? Copy.unknown)
                Spacer()
                StampView(label: detail.vote.result.label, color: detail.vote.result.color, rotation: -4)
                Spacer()
                Text(Formatters.shortDate(detail.vote.date)).kicker()
            }
            Text(detail.vote.cleanTitle)
                .font(.display(ThemeTokens.Text.xxl))
                .multilineTextAlignment(.leading)
        }
    }

    private func summary(_ detail: VoteDetailPayload) -> some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
            if let simplified = detail.vote.summarySimplified {
                Text(Copy.summarySection).kicker()
                MarkdownText(markdown: simplified)
            }
            if let detailText = detail.vote.summaryDetail {
                MarkdownText(markdown: detailText)
            }
            if detail.vote.summarySimplified != nil || detail.vote.summaryDetail != nil {
                Text(Copy.aiNotice)
                    .font(.system(size: ThemeTokens.Text.s))
                    .foregroundStyle(ThemeColor.secondary)
            }
        }
    }
}
