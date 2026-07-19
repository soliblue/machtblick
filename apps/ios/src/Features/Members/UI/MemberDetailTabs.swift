import SwiftUI

enum MemberDetailTab: Hashable {
    case votes
    case speeches

    var label: String {
        self == .votes ? Copy.votesSection : Copy.speechesSection
    }
}

struct MemberDetailTabs: View {
    let tabs: [MemberDetailTab]

    @Binding var selection: MemberDetailTab

    var body: some View {
        SegmentedTabs(tabs: tabs, label: \.label, selection: $selection)
    }
}
