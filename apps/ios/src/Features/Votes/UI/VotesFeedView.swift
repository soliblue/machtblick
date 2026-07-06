import SwiftUI

struct VotesFeedView: View {
    let store: VotesStore
    let cache: ApiCache
    @State private var showFilters = false
    @State private var refreshTick = 0
    @State private var scrollProgress: Double = 0

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
                ScrollView {
                    LazyVStack(spacing: 0) {
                        ForEach(store.filtered) { vote in
                            VoteCardView(vote: vote, cache: cache)
                                .containerRelativeFrame(.vertical)
                                .overlay(alignment: .bottom) {
                                    if vote.id != store.filtered.last?.id {
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
                    min(1, max(0, geo.contentOffset.y / 140))
                } action: { _, value in
                    scrollProgress = value
                }
                .refreshable {
                    await store.refresh(cache: cache)
                    refreshTick += 1
                }
            }
        }
        .background(ThemeColor.background)
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                BrandWordmark(progress: scrollProgress)
            }
            .sharedBackgroundVisibility(.hidden)
            ToolbarItem(placement: .topBarTrailing) {
                Button { showFilters = true } label: {
                    Image(systemName: store.activeFilterCount > 0
                        ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease")
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
