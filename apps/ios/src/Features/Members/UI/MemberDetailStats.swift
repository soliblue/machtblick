import SwiftUI

struct MemberDetailStats: View {
    let detail: MemberDetailPayload

    private var missedVotes: Int {
        detail.history.filter { $0.choice == .nichtAbgegeben }.count
    }

    var body: some View {
        HStack(alignment: .top, spacing: ThemeTokens.Spacing.l) {
            MemberStatValue(
                label: Copy.attendance,
                value: Formatters.percent(detail.attendance),
                supportingText: Copy.missedVotes(missedVotes, total: detail.history.count)
            )
            MemberStatValue(
                label: Copy.loyalty,
                value: detail.loyalty.map { Formatters.percent($0) } ?? "-",
                supportingText: detail.loyalty == nil
                    ? (PartyStyle.hasPartyLine(detail.party) ? Copy.noVoteData : Copy.noPartyLine)
                    : Copy.deviationCount(detail.defections),
                danger: detail.loyalty != nil && detail.defections > 0
            )
        }
    }
}
