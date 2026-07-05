import SwiftUI

struct VotesFeedView: View {
    let store: VotesStore
    let cache: ApiCache

    var body: some View {
        Group {
            if store.votes.isEmpty {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVStack(spacing: 0) {
                        ForEach(store.votes) { vote in
                            VoteCardView(vote: vote, cache: cache)
                                .containerRelativeFrame(.vertical)
                        }
                    }
                    .scrollTargetLayout()
                }
                .scrollTargetBehavior(.paging)
                .scrollIndicators(.hidden)
            }
        }
        .background(ThemeColor.background)
        .navigationTitle(Copy.votesTab)
        .navigationBarTitleDisplayMode(.inline)
        .appDestinations(cache: cache)
        .task { await store.load(cache: cache) }
    }
}
