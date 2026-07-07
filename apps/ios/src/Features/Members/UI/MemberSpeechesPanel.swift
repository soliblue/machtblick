import SwiftUI

struct MemberSpeechesPanel: View {
    let speeches: [MemberDetailPayload.SpeechEntry]
    @State private var query = ""
    @State private var visibleCount = 8
    @State private var openIds: Set<String> = []
    @State private var readerTurns: [SpeechSummary] = []
    @State private var readerIndex: Int?

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
                        MemberSpeechGroupRow(
                            group: group, expanded: openIds.contains(group.id), terms: terms,
                            onToggle: { toggle(group.id) },
                            onOpen: { turns, idx in readerTurns = turns; readerIndex = idx },
                            showDivider: index > 0)
                        .onAppear {
                            if index == visibleGroups.count - 1 && visibleCount < filtered.count {
                                visibleCount += batch
                            }
                        }
                    }
                }
            }
        }
        .sensoryFeedback(.selection, trigger: readerIndex)
        .sheet(isPresented: Binding(get: { readerIndex != nil }, set: { if !$0 { readerIndex = nil } })) {
            if let index = readerIndex, index < readerTurns.count {
                ReaderView(
                    item: .speech(readerTurns[index]), index: index, count: readerTurns.count,
                    terms: terms,
                    onPrev: index > 0 ? { readerIndex = index - 1 } : nil,
                    onNext: index + 1 < readerTurns.count ? { readerIndex = index + 1 } : nil
                )
                .presentationDetents([.large, .medium])
                .presentationDragIndicator(.visible)
            }
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
            group.speeches.contains { speech in
                let hay = "\(speech.speakerName) \(speech.excerpt)".lowercased()
                return terms.allSatisfy { hay.contains($0) }
            }
        }
    }

    private var visibleGroups: [MemberSpeechGroup] {
        Array(filtered.prefix(visibleCount))
    }

    private func toggle(_ id: String) {
        if openIds.contains(id) { openIds.remove(id) } else { openIds.insert(id) }
    }
}
