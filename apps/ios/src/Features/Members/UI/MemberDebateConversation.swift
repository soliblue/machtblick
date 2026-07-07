import SwiftUI

struct MemberDebateConversation: View {
    let memberId: String
    let group: MemberSpeechGroup
    let cache: ApiCache
    @Environment(\.dismiss) private var dismiss
    @State private var store = VoteDetailStore()

    var body: some View {
        NavigationStack {
            ScrollView {
                content
                    .padding(ThemeTokens.Spacing.l)
            }
            .background(ThemeColor.background)
            .navigationTitle(group.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(Copy.close) { dismiss() }
                }
            }
            .task {
                if let voteId = group.voteId { await store.load(id: voteId, cache: cache) }
            }
        }
    }

    @ViewBuilder private var content: some View {
        if group.voteId == nil {
            ConversationThread(
                speeches: MemberSpeechGrouping.summaries(group.speeches), highlightMemberId: memberId)
        } else if let detail = store.detail {
            ConversationThread(
                speeches: VoteDebateAdapter.speeches(detail), highlightMemberId: memberId)
        } else {
            ProgressView()
                .frame(maxWidth: .infinity, minHeight: 240)
        }
    }
}
