import SwiftUI

struct VotesFeedList: View {
    let votes: [VoteListItem]
    let cache: ApiCache
    var onScroll: (Double) -> Void = { _ in }
    var onRefresh: (() async -> Void)? = nil

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                ForEach(votes) { vote in
                    VoteCardView(vote: vote, cache: cache)
                        .containerRelativeFrame(.vertical)
                        .overlay(alignment: .bottom) {
                            if vote.id != votes.last?.id {
                                Rectangle()
                                    .fill(ThemeColor.border)
                                    .frame(height: ThemeTokens.Stroke.s)
                                    .padding(.horizontal, ThemeTokens.Spacing.l)
                            }
                        }
                }
            }
            .scrollTargetLayout()
        }
        .scrollTargetBehavior(.paging)
        .scrollIndicators(.hidden)
        .onScrollGeometryChange(for: Double.self) { geo in
            geo.contentOffset.y
        } action: { _, value in
            onScroll(value)
        }
        .refreshable { await onRefresh?() }
    }
}
