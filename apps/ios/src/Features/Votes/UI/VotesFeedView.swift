import SwiftUI

struct VotesFeedView: View {
    @Bindable var store: VotesStore
    let cache: ApiCache
    @Environment(VoteFlagsStore.self) private var flags
    @State private var showFilters = false
    @State private var refreshTick = 0
    @State private var scroll = ScrollPositionModel()

    private var visible: [VoteListItem] {
        store.filtered.filter { vote in
            switch store.flagFilter {
            case .all: return true
            case .saved: return flags.isSaved(vote.id)
            case .seen: return flags.isSeen(vote.id)
            case .unseen: return !flags.isSeen(vote.id)
            }
        }
    }

    var body: some View {
        Group {
            if store.votes.isEmpty && store.loadFailed {
                ErrorStateView(message: Copy.loadError) { Task { await store.load(cache: cache) } }
            } else if store.votes.isEmpty {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if visible.isEmpty {
                Text(Copy.noResults)
                    .font(.system(size: ThemeTokens.Text.m))
                    .foregroundStyle(ThemeColor.secondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                VotesFeedList(
                    votes: visible, cache: cache, scroll: scroll,
                    onRefresh: { await store.refresh(cache: cache); refreshTick += 1 })
                    .id(store.search)
                    .appStoreScreenshotReady()
            }
        }
        .background(ThemeColor.background)
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .clearsQueryOnSearchDismiss($store.search)
        .searchable(text: $store.search, prompt: Copy.searchVotes)
        .searchToolbarBehavior(.minimize)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                BrandWordmark(scroll: scroll)
            }
            .sharedBackgroundVisibility(.hidden)
            ToolbarItem(placement: .topBarTrailing) {
                Button { showFilters = true } label: {
                    Image(systemName: "line.3.horizontal.decrease")
                }
                .accessibilityLabel(Copy.filterLabel)
            }
            DefaultToolbarItem(kind: .search, placement: .topBarTrailing)
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
