import SwiftUI

struct MembersGridView: View {
    @Bindable var store: MembersStore
    let cache: ApiCache
    @State private var showFilters = false
    @State private var refreshTick = 0

    var body: some View {
        Group {
            if store.members.isEmpty && store.loadFailed {
                ErrorStateView(message: Copy.loadError) { Task { await store.load(cache: cache) } }
            } else if store.members.isEmpty {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                grid
            }
        }
        .background(ThemeColor.background)
        .navigationTitle(Copy.membersTab)
        .navigationBarTitleDisplayMode(.large)
        .searchable(text: $store.search, prompt: Copy.searchMembers)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showFilters = true } label: {
                    Image(systemName: store.activeFilterCount > 0
                        ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease")
                }
            }
        }
        .sheet(isPresented: $showFilters) {
            MembersFilterSheet(store: store)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
        .sensoryFeedback(.success, trigger: refreshTick)
        .appDestinations(cache: cache)
        .task { await store.load(cache: cache) }
    }

    private var grid: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.l) {
                DemographicsStrip(members: store.filtered)
                Text("\(store.filtered.count) \(Copy.people)").kicker()
                if store.filtered.isEmpty {
                    Text(Copy.noMembersFound)
                        .font(.system(size: ThemeTokens.Text.m))
                        .foregroundStyle(ThemeColor.secondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, ThemeTokens.Spacing.xl)
                } else {
                    LazyVGrid(
                        columns: Array(repeating: GridItem(.flexible(), spacing: ThemeTokens.Spacing.s), count: 3),
                        spacing: ThemeTokens.Spacing.s
                    ) {
                        ForEach(store.filtered) { member in
                            NavigationLink(value: AppRoute.member(member.id)) {
                                MemberCardView(member: member)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding(ThemeTokens.Spacing.l)
        }
        .refreshable {
            await store.refresh(cache: cache)
            refreshTick += 1
        }
    }
}
