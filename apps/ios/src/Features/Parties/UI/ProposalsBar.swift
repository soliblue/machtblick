import SwiftUI

struct ProposalsBar: View {
    let proposals: [PartyDetailPayload.Proposal]
    let cache: ApiCache
    @State private var showSheet = false

    var body: some View {
        Button { showSheet = true } label: {
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
        .sheet(isPresented: $showSheet) {
            ProposalsSheet(proposals: proposals, cache: cache)
        }
    }

    private var accepted: Int {
        proposals.filter { $0.result == .angenommen }.count
    }
}
