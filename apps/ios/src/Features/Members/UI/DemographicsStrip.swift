import SwiftUI

struct DemographicsStrip: View {
    let members: [MemberListItem]
    var showFaction = true

    var body: some View {
        HStack(alignment: .top, spacing: ThemeTokens.Spacing.m) {
            PieDonutView(title: Copy.filterSex, slices: Demographics.gender(members))
            PieDonutView(title: Copy.filterAge, slices: Demographics.age(members))
            if showFaction {
                PieDonutView(title: Copy.demographicsFaction, slices: Demographics.faction(members))
            }
        }
    }
}
