import SwiftUI

private enum RootTab: Hashable {
    case votes
    case members
    case parties
    case more
}

struct RootTabView: View {
    let cache: ApiCache
    @State private var votesStore = VotesStore()
    @State private var membersStore = MembersStore()
    @State private var partiesStore = PartiesStore()
    @State private var tab: RootTab = .votes

    var body: some View {
        TabView(selection: $tab) {
            Tab(Copy.votesTab, systemImage: "checkmark.seal", value: RootTab.votes) {
                NavigationStack {
                    VotesFeedView(store: votesStore, cache: cache)
                }
            }
            Tab(Copy.membersTab, systemImage: "person.3", value: RootTab.members) {
                NavigationStack {
                    MembersGridView(store: membersStore, cache: cache)
                }
            }
            Tab(Copy.partiesTab, systemImage: "chart.pie", value: RootTab.parties) {
                NavigationStack {
                    PartiesView(store: partiesStore, cache: cache)
                }
            }
            Tab(Copy.moreTab, systemImage: "ellipsis.circle", value: RootTab.more) {
                NavigationStack {
                    SettingsView(cache: cache)
                }
            }
        }
        .tint(ThemeColor.fg)
        .sensoryFeedback(.selection, trigger: tab)
    }
}
