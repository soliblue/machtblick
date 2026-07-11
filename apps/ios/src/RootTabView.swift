import SwiftUI

private enum RootTab: Hashable {
    case votes
    case members
    case parties
}

struct RootTabView: View {
    let cache: ApiCache
    @State private var votesStore = VotesStore()
    @State private var membersStore = MembersStore()
    @State private var partiesStore = PartiesStore()
    @State private var flagsStore = VoteFlagsStore()
    @State private var tab: RootTab = .votes

    var body: some View {
        TabView(selection: $tab) {
            Tab(value: RootTab.votes) {
                NavigationStack {
                    VotesFeedView(store: votesStore, cache: cache)
                }
            } label: {
                Image(systemName: "checkmark.seal")
                    .accessibilityLabel(Copy.votesTab)
            }
            Tab(value: RootTab.members) {
                NavigationStack {
                    MembersGridView(store: membersStore, cache: cache)
                }
            } label: {
                Image(systemName: "person.2")
                    .accessibilityLabel(Copy.membersTab)
            }
            Tab(value: RootTab.parties) {
                NavigationStack {
                    PartiesView(store: partiesStore, cache: cache)
                }
            } label: {
                Image(systemName: "chart.pie")
                    .accessibilityLabel(Copy.partiesTab)
            }
        }
        .tabBarMinimizeBehavior(.onScrollDown)
        .environment(flagsStore)
        .tint(ThemeColor.fg)
        .sensoryFeedback(.selection, trigger: tab)
        .onAppear { KeyboardDismisser.shared.install() }
    }
}
