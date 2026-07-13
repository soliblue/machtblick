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
    @Binding var appTheme: AppTheme
    @State private var votesStore = VotesStore()
    @State private var membersStore = MembersStore()
    @State private var partiesStore = PartiesStore()
    @State private var flagsStore = VoteFlagsStore()
    @State private var tab: RootTab = .votes
    @State private var votesPath: [AppRoute] = []
    @State private var membersPath: [AppRoute] = []
    @State private var partiesPath: [AppRoute] = []

    init(cache: ApiCache, appLanguage: Binding<AppLanguage>, appTheme: Binding<AppTheme>) {
        self.cache = cache
        _appLanguage = appLanguage
        _appTheme = appTheme
        switch AppStoreScreenshotScenario.current?.destination {
        case .vote(let id):
            _tab = State(initialValue: .votes)
            _votesPath = State(initialValue: [.vote(id)])
        case .member(let id):
            _tab = State(initialValue: .members)
            _membersPath = State(initialValue: [.member(id)])
        case .party(let id):
            _tab = State(initialValue: .parties)
            _partiesPath = State(initialValue: [.party(id)])
        case .votes, .none:
            _tab = State(initialValue: .votes)
        }
    }

    var body: some View {
        TabView(selection: $tab) {
            Tab(value: RootTab.votes) {
                NavigationStack(path: $votesPath) {
                    VotesFeedView(store: votesStore, cache: cache)
                }
                .id(appLanguage)
            } label: {
                Image(systemName: "checkmark.seal")
                    .accessibilityLabel(Copy.votesTab)
            }
            Tab(value: RootTab.members) {
                NavigationStack(path: $membersPath) {
                    MembersGridView(store: membersStore, cache: cache)
                }
                .id(appLanguage)
            } label: {
                Image(systemName: "person.2")
                    .accessibilityLabel(Copy.membersTab)
            }
            Tab(value: RootTab.parties) {
                NavigationStack(path: $partiesPath) {
                    PartiesView(store: partiesStore, cache: cache)
                }
                .id(appLanguage)
            } label: {
                Image(systemName: "chart.pie")
                    .accessibilityLabel(Copy.partiesTab)
            }
            Tab(value: RootTab.more) {
                NavigationStack {
                    SettingsView(cache: cache, appLanguage: $appLanguage, appTheme: $appTheme)
                }
            } label: {
                Image(systemName: "slider.horizontal.3")
                    .accessibilityLabel(Copy.moreTab)
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
