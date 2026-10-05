import SwiftUI

struct MotionDetailView: View {
    let id: Int
    let cache: ApiCache
    @State private var store = MotionDetailStore()

    var body: some View {
        Group {
            if let detail = store.detail {
                ScrollView {
                    VStack(alignment: .leading, spacing: ThemeTokens.Spacing.l) {
                        MotionDetailHeader(
                            detail: detail, proposers: store.proposers,
                            isLaenderInitiative: store.isLaenderInitiative,
                            status: store.status, statusLabel: store.statusLabel)
                        SegmentedTabs(
                            tabs: store.availableTabs, label: \.label, selection: $store.selectedTab)
                            .accessibilityIdentifier("motion-detail-tabs")
                        switch store.selectedTab {
                        case .result:
                            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xl) {
                                ForEach(detail.linkedVotes) { vote in
                                    MotionLinkedVoteCard(vote: vote, detail: store.linkedVoteDetails[vote.id])
                                }
                            }
                        case .details:
                            MotionDetailsPanel(antrag: detail.antrag, stages: store.stages)
                                .accessibilityIdentifier("motion-details")
                        case .speeches:
                            DebatePanel(speeches: store.speeches, partySummaries: store.partySummaries)
                                .accessibilityIdentifier("motion-speeches")
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(ThemeTokens.Spacing.l)
                }
                .scrollDismissesKeyboard(.interactively)
                .accessibilityIdentifier(store.linkedVotesLoaded ? "motion-detail-ready" : "motion-detail-loading")
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        ShareLinkButton(
                            title: detail.antrag.cleanTitle ?? detail.antrag.title,
                            url: HTTPClient.page("/motions/\(id)"))
                    }
                }
            } else if store.loadFailed {
                ErrorStateView(message: Copy.loadError) { Task { await store.load(id: id, cache: cache) } }
            } else {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .background(ThemeColor.background)
        .navigationBarTitleDisplayMode(.inline)
        .task { await store.load(id: id, cache: cache) }
    }
}
