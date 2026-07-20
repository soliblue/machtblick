import SwiftUI

struct VotesFeedList: View {
    let votes: [VoteListItem]
    let cache: ApiCache
    let scroll: ScrollPositionModel
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
        .scrollPosition(scroll.binding)
        .scrollIndicators(.hidden)
        .scrollDismissesKeyboard(.interactively)
        .onScrollGeometryChange(for: Double.self) { geo in
            geo.contentOffset.y
        } action: { _, value in
            scroll.y = value
        }
        .refreshable { await onRefresh?() }
    }
}
