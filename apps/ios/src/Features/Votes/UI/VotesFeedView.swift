import SwiftUI

struct VotesFeedView: View {
    let store: VotesStore
    let cache: ApiCache
    @State private var showFilters = false
    @State private var refreshTick = 0
    @State private var scrollY: Double = 0

    var body: some View {
        Group {
            if store.votes.isEmpty && store.loadFailed {
                ErrorStateView(message: Copy.loadError) { Task { await store.load(cache: cache) } }
            } else if store.votes.isEmpty {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if store.filtered.isEmpty {
                Text(Copy.noResults)
                    .font(.system(size: ThemeTokens.Text.m))
                    .foregroundStyle(ThemeColor.secondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                VotesFeedList(
                    votes: store.filtered, cache: cache,
                    onScroll: { scrollY = $0 },
                    onRefresh: { await store.refresh(cache: cache); refreshTick += 1 })
            }
        }
        .background(ThemeColor.background)
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                BrandWordmark(scrollY: scrollY)
            }
            .sharedBackgroundVisibility(.hidden)
            ToolbarItem(placement: .topBarTrailing) {
                Button { showFilters = true } label: {
                    Image(systemName: "line.3.horizontal.decrease")
                }
            }
        }
        .appDestinations(cache: cache)
        .sheet(isPresented: $showFilters) {
            VotesFilterSheet(store: store)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
        .sensoryFeedback(.success, trigger: refreshTick)
        .task { await store.load(cache: cache) }
    }
}
