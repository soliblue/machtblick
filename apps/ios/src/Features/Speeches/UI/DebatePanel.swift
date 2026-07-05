import SwiftUI

struct DebatePanel: View {
    let speeches: [SpeechSummary]
    let partySummaries: [PartySummaryReader]
    @State private var query = ""
    @State private var speechIndex: Int?
    @State private var summaryIndex: Int?

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.l) {
            PartySummaryStrip(summaries: partySummaries) { summaryIndex = $0 }
            Text(Copy.debateTimeline).kicker()
            searchField
            if rows.isEmpty {
                Text(Copy.noSpeechesFound)
                    .font(.system(size: ThemeTokens.Text.m))
                    .foregroundStyle(ThemeColor.secondary)
                    .padding(.vertical, ThemeTokens.Spacing.l)
            } else {
                DebateThreadView(rows: rows) { speechIndex = $0 }
            }
        }
        .sheet(
            isPresented: Binding(get: { speechIndex != nil }, set: { if !$0 { speechIndex = nil } })
        ) {
            if let index = speechIndex, index < speechItems.count {
                ReaderView(
                    item: .speech(speechItems[index]), index: index, count: speechItems.count,
                    onPrev: index > 0 ? { speechIndex = index - 1 } : nil,
                    onNext: index + 1 < speechItems.count ? { speechIndex = index + 1 } : nil,
                    onClose: { speechIndex = nil }
                )
                .presentationDetents([.large, .medium])
                .presentationDragIndicator(.visible)
            }
        }
        .sheet(
            isPresented: Binding(get: { summaryIndex != nil }, set: { if !$0 { summaryIndex = nil } })
        ) {
            if let index = summaryIndex, index < partySummaries.count {
                ReaderView(
                    item: .summary(partySummaries[index]), index: index, count: partySummaries.count,
                    onPrev: index > 0 ? { summaryIndex = index - 1 } : nil,
                    onNext: index + 1 < partySummaries.count ? { summaryIndex = index + 1 } : nil,
                    onClose: { summaryIndex = nil }
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
        }
        .padding(.horizontal, ThemeTokens.Spacing.s)
        .padding(.vertical, ThemeTokens.Spacing.s)
        .overlay(Rectangle().strokeBorder(ThemeColor.border, lineWidth: ThemeTokens.Stroke.s))
    }

    private var terms: [String] {
        query.lowercased().split(separator: " ").map(String.init)
    }

    private var filtered: [SpeechSummary] {
        guard !terms.isEmpty else { return speeches }
        return speeches.filter { speech in
            let hay = "\(speech.speakerName) \(speech.excerpt)".lowercased()
            return terms.allSatisfy { hay.contains($0) }
        }
    }

    private var rows: [DebateThreadRow] {
        DebateThreadBuilder.rows(from: filtered)
    }

    private var speechItems: [SpeechSummary] {
        rows.compactMap { row in
            if case .turn(let speech, _, _, _) = row { return speech }
            return nil
        }
    }
}
