import SwiftUI

struct MemberSpeechesPanel: View {
    let speeches: [MemberDetailPayload.SpeechEntry]
    @State private var query = ""
    @State private var page = 0
    @State private var openIds: Set<String> = []
    @State private var readerTurns: [SpeechSummary] = []
    @State private var readerIndex: Int?

    private let pageSize = 5

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.m) {
            searchField
            if pageGroups.isEmpty {
                Text(Copy.noSpeechesFound)
                    .font(.system(size: ThemeTokens.Text.m))
                    .foregroundStyle(ThemeColor.secondary)
                    .padding(.vertical, ThemeTokens.Spacing.l)
            } else {
                LazyVStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(pageGroups.enumerated()), id: \.element.id) { index, group in
                        MemberSpeechGroupRow(
                            group: group, expanded: openIds.contains(group.id),
                            onToggle: { toggle(group.id) },
                            onOpen: { turns, index in readerTurns = turns; readerIndex = index },
                            showDivider: index > 0)
                    }
                }
                if pageCount > 1 { pager }
            }
        }
        .sensoryFeedback(.selection, trigger: readerIndex)
        .sheet(isPresented: Binding(get: { readerIndex != nil }, set: { if !$0 { readerIndex = nil } })) {
            if let index = readerIndex, index < readerTurns.count {
                ReaderView(
                    item: .speech(readerTurns[index]), index: index, count: readerTurns.count,
                    onPrev: index > 0 ? { readerIndex = index - 1 } : nil,
                    onNext: index + 1 < readerTurns.count ? { readerIndex = index + 1 } : nil,
                    onClose: { readerIndex = nil }
                )
                .presentationDetents([.large, .medium])
                .presentationDragIndicator(.visible)
            }
        }
    }

    private var searchField: some View {
        HStack(spacing: ThemeTokens.Spacing.s) {
            Image(systemName: "magnifyingglass").font(.system(size: ThemeTokens.Icon.s))
                .foregroundStyle(ThemeColor.secondary)
            TextField(Copy.searchSpeeches, text: $query)
                .font(.system(size: ThemeTokens.Text.m))
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .onChange(of: query) { page = 0 }
        }
        .padding(.horizontal, ThemeTokens.Spacing.s)
        .padding(.vertical, ThemeTokens.Spacing.s)
        .overlay(Rectangle().strokeBorder(ThemeColor.border, lineWidth: ThemeTokens.Stroke.s))
    }

    private var pager: some View {
        HStack {
            Button { page = max(0, page - 1) } label: {
                Image(systemName: "chevron.left").font(.system(size: ThemeTokens.Icon.m))
            }
            .disabled(page == 0)
            Spacer()
            Text("\(page + 1) / \(pageCount)")
                .font(.system(size: ThemeTokens.Text.s))
                .foregroundStyle(ThemeColor.secondary)
                .monospacedDigit()
            Spacer()
            Button { page = min(pageCount - 1, page + 1) } label: {
                Image(systemName: "chevron.right").font(.system(size: ThemeTokens.Icon.m))
            }
            .disabled(page >= pageCount - 1)
        }
        .foregroundStyle(ThemeColor.secondary)
        .padding(.vertical, ThemeTokens.Spacing.s)
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

    private var pageCount: Int {
        max(1, Int(ceil(Double(filtered.count) / Double(pageSize))))
    }

    private var pageGroups: [MemberSpeechGroup] {
        let safe = min(page, pageCount - 1)
        return Array(filtered.dropFirst(safe * pageSize).prefix(pageSize))
    }

    private func toggle(_ id: String) {
        if openIds.contains(id) { openIds.remove(id) } else { openIds.insert(id) }
    }
}
