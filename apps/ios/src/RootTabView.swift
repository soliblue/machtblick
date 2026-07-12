import SwiftUI

private enum RootTab: Hashable {
    case votes
    case members
    case parties
    case more
}

struct RootTabView: View {
    let cache: ApiCache
    @Binding var appLanguage: AppLanguage
    @State private var votesStore = VotesStore()
    @State private var membersStore = MembersStore()
    @State private var partiesStore = PartiesStore()
    @State private var flagsStore = VoteFlagsStore()
    @State private var tab: RootTab = .votes
    @State private var votesPath: [AppRoute] = []
    @State private var membersPath: [AppRoute] = []
    @State private var partiesPath: [AppRoute] = []

    var body: some View {
        TabView(selection: $tab) {
            Tab(value: RootTab.votes) {
                NavigationStack(path: $votesPath) {
                    VotesFeedView(store: votesStore, cache: cache)
                }
                .id(appLanguage)
            } label: {
                Label(Copy.votesTab, systemImage: "checkmark.seal")
            }
            Tab(value: RootTab.members) {
                NavigationStack(path: $membersPath) {
                    MembersGridView(store: membersStore, cache: cache)
                }
                .id(appLanguage)
            } label: {
                Label(Copy.membersTab, systemImage: "person.2")
            }
            Tab(value: RootTab.parties) {
                NavigationStack(path: $partiesPath) {
                    PartiesView(store: partiesStore, cache: cache)
                }
                .id(appLanguage)
            } label: {
                Label(Copy.partiesTab, systemImage: "chart.pie")
            }
            Tab(value: RootTab.more) {
                NavigationStack {
                    SettingsView(cache: cache, appLanguage: $appLanguage)
                }
            } label: {
                Label(Copy.moreTab, systemImage: "ellipsis.circle")
            }
        }
        .tabBarMinimizeBehavior(.onScrollDown)
        .environment(flagsStore)
        .tint(ThemeColor.fg)
        .sensoryFeedback(.selection, trigger: tab)
        .onAppear { KeyboardDismisser.shared.install() }
        .onChange(of: appLanguage) {
            votesPath = []
            membersPath = []
            partiesPath = []
            votesStore = VotesStore()
            membersStore = MembersStore()
            partiesStore = PartiesStore()
        }
    }
}
