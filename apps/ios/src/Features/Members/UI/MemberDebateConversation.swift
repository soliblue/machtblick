import SwiftUI

struct MemberDebateConversation: View {
    let memberId: String
    let group: MemberSpeechGroup
    let cache: ApiCache
    @Environment(\.dismiss) private var dismiss
    @State private var store = VoteDetailStore()
    @State private var fullDebate: [SpeechSummary]?

    var body: some View {
        NavigationStack {
            ScrollView {
                content
                    .padding(ThemeTokens.Spacing.l)
            }
            .background(ThemeColor.background)
            .navigationTitle(group.title)
            .navigationBarTitleDisplayMode(.inline)
            .appDestinations(cache: cache)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(Copy.close) { dismiss() }
                }
            }
            .task {
                if let debateGroupId = group.debateGroupId {
                    fullDebate = await DebateGroupService.speeches(debateGroupId: debateGroupId, cache: cache)
                } else if let voteId = group.voteId {
                    await store.load(id: voteId, cache: cache)
                }
            }
        }
    }

    @ViewBuilder private var content: some View {
        if group.debateGroupId != nil {
            if let fullDebate {
                ConversationThread(
                    speeches: fullDebate.isEmpty ? MemberSpeechGrouping.summaries(group.speeches) : fullDebate,
                    highlightMemberId: memberId)
            } else {
                ProgressView()
                    .frame(maxWidth: .infinity, minHeight: 240)
            }
        } else if group.voteId != nil {
            if let detail = store.detail {
                ConversationThread(
                    speeches: VoteDebateAdapter.speeches(detail), highlightMemberId: memberId)
            } else {
                ProgressView()
                    .frame(maxWidth: .infinity, minHeight: 240)
            }
        } else {
            ConversationThread(
                speeches: MemberSpeechGrouping.summaries(group.speeches), highlightMemberId: memberId)
        }
    }
}
