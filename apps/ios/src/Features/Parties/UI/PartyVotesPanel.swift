import SwiftUI

struct PartyVotesPanel: View {
    let votes: [PartyDetailPayload.VoteEntry]

    var body: some View {
        LazyVStack(alignment: .leading, spacing: 0) {
            ForEach(Array(votes.enumerated()), id: \.element.id) { index, vote in
                PartyVoteRow(vote: vote, showDivider: index > 0)
            }
        }
    }
}
