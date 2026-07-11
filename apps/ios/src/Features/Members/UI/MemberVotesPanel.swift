import SwiftUI

struct MemberVotesPanel: View {
    let history: [MemberDetailPayload.HistoryEntry]

    var body: some View {
        LazyVStack(alignment: .leading, spacing: 0) {
            ForEach(history) { entry in
                MemberVoteCard(entry: entry)
                    .overlay(alignment: .bottom) {
                        if entry.id != history.last?.id {
                            Rectangle()
                                .fill(ThemeColor.elevated)
                                .frame(height: ThemeTokens.Stroke.s)
                                .padding(.horizontal, ThemeTokens.Spacing.l)
                        }
                    }
            }
        }
    }
}
