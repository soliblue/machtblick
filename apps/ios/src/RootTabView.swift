import SwiftUI

struct RootTabView: View {
    let cache: ApiCache
    @State private var votesStore = VotesStore()
    @State private var membersStore = MembersStore()
    @State private var partiesStore = PartiesStore()

    var body: some View {
        TabView {
            Tab(Copy.votesTab, systemImage: "checkmark.seal") {
                NavigationStack {
                    VotesFeedView(store: votesStore, cache: cache)
                }
            }
            Tab(Copy.membersTab, systemImage: "person.3") {
                NavigationStack {
                    MembersGridView(store: membersStore, cache: cache)
                }
            }
            Tab(Copy.partiesTab, systemImage: "chart.pie") {
                NavigationStack {
                    PartiesView(store: partiesStore, cache: cache)
                }
            }
            Tab(Copy.moreTab, systemImage: "ellipsis.circle") {
                NavigationStack {
                    SettingsView(cache: cache)
                }
            }
        }
        .tint(ThemeColor.fg)
    }
}
