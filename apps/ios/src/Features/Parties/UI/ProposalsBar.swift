import SwiftUI

struct ProposalsBar: View {
    let party: String
    let proposals: [PartyDetailPayload.Proposal]

    var body: some View {
        NavigationLink(value: AppRoute.proposals(party: party, voteIds: proposals.map(\.voteId))) {
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
                HStack {
                    Text(Copy.tabMotions).kicker()
                    Spacer()
                    Text("\(accepted) / \(proposals.count) \(Copy.acceptedCountSuffix)")
                        .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                        .monospacedDigit()
                }
                HStack(spacing: 2) {
                    ForEach(proposals) { proposal in
                        Rectangle()
                            .fill(proposal.result.color)
                            .frame(maxWidth: .infinity)
                    }
                }
                .frame(height: 32)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private var accepted: Int {
        proposals.filter { $0.result == .angenommen }.count
    }
}
