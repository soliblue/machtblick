import SwiftUI

struct VotesFeedView: View {
    let store: VotesStore
    let cache: ApiCache
    @State private var showFilters = false

    var body: some View {
        Group {
            if store.votes.isEmpty {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if store.filtered.isEmpty {
                Text(Copy.noResults)
                    .font(.system(size: ThemeTokens.Text.m))
                    .foregroundStyle(ThemeColor.secondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVStack(spacing: 0) {
                        ForEach(store.filtered) { vote in
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
        .overlay(alignment: .bottom) { filterButton }
        .background(ThemeColor.background)
        .navigationTitle(Copy.votesTab)
        .navigationBarTitleDisplayMode(.inline)
        .appDestinations(cache: cache)
        .sheet(isPresented: $showFilters) {
            VotesFilterSheet(store: store)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
        .task { await store.load(cache: cache) }
    }

    @ViewBuilder private var filterButton: some View {
        if !store.votes.isEmpty {
            Button { showFilters = true } label: {
                HStack(spacing: ThemeTokens.Spacing.s) {
                    Image(systemName: "line.3.horizontal.decrease")
                        .font(.system(size: ThemeTokens.Icon.s))
                    Text(store.activeFilterCount > 0 ? "\(Copy.filterLabel) · \(store.activeFilterCount)" : Copy.filterLabel)
                        .font(.system(size: ThemeTokens.Text.m, weight: store.activeFilterCount > 0 ? .semibold : .regular))
                }
                .foregroundStyle(ThemeColor.background)
                .padding(.horizontal, ThemeTokens.Spacing.l)
                .padding(.vertical, ThemeTokens.Spacing.s)
                .background(ThemeColor.fg)
                .clipShape(Capsule())
            }
            .padding(.bottom, ThemeTokens.Spacing.l)
        }
    }
}
