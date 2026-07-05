import SwiftUI

struct PartyProfilePanel: View {
    let detail: PartyDetailPayload
    let members: [MemberListItem]

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xl) {
            SuccessRateBar(rate: detail.successRate, matched: detail.successMatched, decided: detail.successDecided)
            if !detail.proposals.isEmpty {
                ProposalsBar(proposals: detail.proposals)
            }
            if !detail.alignments.isEmpty {
                AlignmentList(alignments: detail.alignments)
            }
            if !detail.donations.isEmpty {
                DonationsBar(donations: detail.donations, totalEur: detail.donationsTotalEur)
            }
            if !partyMembers.isEmpty {
                VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
                    Text(Copy.membersCount).kicker()
                    DemographicsStrip(members: partyMembers, showFaction: false)
                }
            }
        }
    }

    private var partyMembers: [MemberListItem] {
        members.filter { $0.party == detail.party }
    }
}
