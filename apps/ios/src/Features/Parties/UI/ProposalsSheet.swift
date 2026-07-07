import SwiftUI

struct ProposalsSheet: View {
    let proposals: [PartyDetailPayload.Proposal]
    let cache: ApiCache

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(Array(proposals.enumerated()), id: \.element.id) { index, proposal in
                        ProposalRow(proposal: proposal, showDivider: index > 0)
                    }
                }
                .padding(ThemeTokens.Spacing.l)
            }
            .background(ThemeColor.background)
            .navigationTitle(Copy.tabMotions)
            .navigationBarTitleDisplayMode(.inline)
            .appDestinations(cache: cache)
        }
        .presentationDragIndicator(.visible)
    }
}
