import SwiftUI

struct PartyProfilePanel: View {
    let detail: PartyDetailPayload
    let cache: ApiCache

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xl) {
            if !detail.proposals.isEmpty {
                ProposalsBar(proposals: detail.proposals, cache: cache)
            }
            if !detail.alignments.isEmpty {
                AlignmentList(alignments: detail.alignments)
            }
            if !detail.donations.isEmpty {
                DonationsBar(donations: detail.donations, totalEur: detail.donationsTotalEur)
            }
        }
    }
}
