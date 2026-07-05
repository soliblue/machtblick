import SwiftUI

struct MembersGridView: View {
    @Bindable var store: MembersStore
    let cache: ApiCache

    var body: some View {
        ScrollView {
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
            .padding(ThemeTokens.Spacing.l)
        }
        .background(ThemeColor.background)
        .navigationTitle(Copy.membersTab)
        .navigationBarTitleDisplayMode(.inline)
        .searchable(text: $store.search, prompt: Copy.searchMembers)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Picker(Copy.partiesTab, selection: $store.party) {
                        Text(Copy.allParties).tag(String?.none)
                        ForEach(store.parties, id: \.self) { party in
                            Text(PartyStyle.label(party)).tag(String?.some(party))
                        }
                    }
                    Picker(Copy.allStates, selection: $store.state) {
                        Text(Copy.allStates).tag(String?.none)
                        ForEach(store.states, id: \.self) { state in
                            Text(state).tag(String?.some(state))
                        }
                    }
                } label: {
                    Image(systemName: "line.3.horizontal.decrease")
                }
            }
        }
        .appDestinations(cache: cache)
        .task { await store.load(cache: cache) }
    }
}
