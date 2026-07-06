import SwiftUI
import UIKit

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
    @State private var tab: RootTab = .votes

    init(cache: ApiCache) {
        self.cache = cache
        let appearance = UITabBarAppearance()
        appearance.configureWithDefaultBackground()
        for item in [appearance.stackedLayoutAppearance, appearance.inlineLayoutAppearance, appearance.compactInlineLayoutAppearance] {
            item.normal.titleTextAttributes = [.foregroundColor: UIColor.clear]
            item.selected.titleTextAttributes = [.foregroundColor: UIColor.clear]
            item.normal.titlePositionAdjustment = UIOffset(horizontal: 0, vertical: .greatestFiniteMagnitude)
            item.selected.titlePositionAdjustment = UIOffset(horizontal: 0, vertical: .greatestFiniteMagnitude)
        }
        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
    }

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
        }
        .tint(ThemeColor.fg)
        .sensoryFeedback(.selection, trigger: tab)
    }
}
