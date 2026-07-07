import SwiftUI

struct DemographicsStrip: View {
    let members: [MemberListItem]
    var showFaction = true

    var body: some View {
        HStack(alignment: .top, spacing: ThemeTokens.Spacing.m) {
            PieDonutView(title: Copy.filterSex, slices: Demographics.gender(members), maxWidth: cap)
                .frame(maxWidth: showFaction ? nil : .infinity)
            PieDonutView(title: Copy.filterAge, slices: Demographics.age(members), maxWidth: cap)
                .frame(maxWidth: showFaction ? nil : .infinity)
            if showFaction {
                PieDonutView(title: Copy.demographicsFaction, slices: Demographics.faction(members), maxWidth: cap)
            }
        }
    }

    private var cap: CGFloat {
        showFaction ? 130 : .infinity
    }
}
