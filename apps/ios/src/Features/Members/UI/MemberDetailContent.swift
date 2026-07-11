import SwiftUI

struct MemberDetailContent: View {
    let detail: MemberDetailPayload
    let cache: ApiCache

    @State private var tab = MemberDetailTab.votes

    private var availableTabs: [MemberDetailTab] {
        var tabs: [MemberDetailTab] = []
        if !detail.history.isEmpty { tabs.append(.votes) }
        if !detail.speeches.isEmpty { tabs.append(.speeches) }
        return tabs
    }

    private var activeTab: MemberDetailTab {
        availableTabs.contains(tab) ? tab : (availableTabs.first ?? .votes)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xl) {
                MemberDetailHeader(detail: detail)
                MemberDetailStats(detail: detail)
                if availableTabs.count > 1 {
                    MemberDetailTabs(tabs: availableTabs, selection: $tab)
                }
                MemberDetailPanel(detail: detail, tab: activeTab, cache: cache)
            }
            .padding(ThemeTokens.Spacing.l)
        }
        .scrollDismissesKeyboard(.interactively)
        .sensoryFeedback(.selection, trigger: tab)
    }
}
