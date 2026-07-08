import SwiftUI

struct PartyProposalsFeed: View {
    let party: String
    let voteIds: [String]
    let cache: ApiCache
    @State private var store = VotesStore()

    var body: some View {
        Group {
            if !store.loaded && store.votes.isEmpty {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if feed.isEmpty {
                Text(Copy.noResults)
                    .font(.system(size: ThemeTokens.Text.m))
                    .foregroundStyle(ThemeColor.secondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                VotesFeedList(votes: feed, cache: cache)
            }
        }
        .background(ThemeColor.background)
        .navigationTitle("\(Copy.tabMotions) · \(PartyStyle.label(party))")
        .navigationBarTitleDisplayMode(.inline)
        .task { await store.load(cache: cache) }
    }

    private var feed: [VoteListItem] {
        let byId = Dictionary(store.votes.map { ($0.id, $0) }, uniquingKeysWith: { first, _ in first })
        return voteIds.compactMap { byId[$0] }
    }
}
