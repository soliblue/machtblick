import SwiftUI

struct MembersGridView: View {
    @Bindable var store: MembersStore
    let cache: ApiCache
    @State private var showFilters = false

    var body: some View {
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
        .background(ThemeColor.background)
        .navigationTitle(Copy.membersTab)
        .navigationBarTitleDisplayMode(.inline)
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
        .appDestinations(cache: cache)
        .task { await store.load(cache: cache) }
    }
}
