import SwiftUI

struct MemberVotesPanel: View {
    let history: [MemberDetailPayload.HistoryEntry]

    var body: some View {
        LazyVStack(alignment: .leading, spacing: 0) {
            ForEach(Array(history.enumerated()), id: \.element.id) { index, entry in
                MemberVoteRow(entry: entry, showDivider: index > 0)
            }
        }
    }
}
