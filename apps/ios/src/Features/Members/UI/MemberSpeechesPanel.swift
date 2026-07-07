import SwiftUI

struct MemberSpeechesPanel: View {
    let memberId: String
    let speeches: [MemberDetailPayload.SpeechEntry]
    let cache: ApiCache
    @State private var query = ""
    @State private var visibleCount = 8
    @State private var openGroup: MemberSpeechGroup?

    private let batch = 8

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
            SearchField(placeholder: Copy.searchSpeeches, text: $query)
                .onChange(of: query) { visibleCount = batch }
            if filtered.isEmpty {
                Text(Copy.noSpeechesFound)
                    .font(.system(size: ThemeTokens.Text.m))
                    .foregroundStyle(ThemeColor.secondary)
                    .padding(.vertical, ThemeTokens.Spacing.l)
            } else {
                LazyVStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(visibleGroups.enumerated()), id: \.element.id) { index, group in
                        Button { openGroup = group } label: {
                            ChatInboxRow(group: group, showDivider: index > 0)
                        }
                        .buttonStyle(.plain)
                        .onAppear {
                            if index == visibleGroups.count - 1 && visibleCount < filtered.count {
                                visibleCount += batch
                            }
                        }
                    }
                }
            }
        }
        .sensoryFeedback(.selection, trigger: openGroup?.id)
        .fullScreenCover(item: $openGroup) { group in
            MemberDebateConversation(memberId: memberId, group: group, cache: cache)
        }
    }

    private var terms: [String] {
        query.lowercased().split(separator: " ").map(String.init)
    }

    private var allGroups: [MemberSpeechGroup] {
        MemberSpeechGrouping.groups(speeches)
    }

    private var filtered: [MemberSpeechGroup] {
        guard !terms.isEmpty else { return allGroups }
        return allGroups.filter { group in
            let hay = "\(group.title) \(group.main.excerpt)".lowercased()
            return terms.allSatisfy { hay.contains($0) }
        }
    }

    private var visibleGroups: [MemberSpeechGroup] {
        Array(filtered.prefix(visibleCount))
    }
}
