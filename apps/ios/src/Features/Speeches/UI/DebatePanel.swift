import SwiftUI

struct DebatePanel: View {
    let speeches: [SpeechSummary]
    let partySummaries: [PartySummaryReader]
    @State private var query = ""
    @State private var summaryIndex: Int?

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.l) {
            PartySummaryStrip(summaries: partySummaries) { summaryIndex = $0 }
            Text(Copy.debateTimeline).kicker()
            SearchField(placeholder: Copy.searchSpeeches, text: $query)
            if filtered.isEmpty {
                Text(Copy.noSpeechesFound)
                    .font(.system(size: ThemeTokens.Text.m))
                    .foregroundStyle(ThemeColor.secondary)
                    .padding(.vertical, ThemeTokens.Spacing.l)
            } else {
                ConversationThread(speeches: filtered)
            }
        }
        .sensoryFeedback(.selection, trigger: summaryIndex)
        .sheet(
            isPresented: Binding(get: { summaryIndex != nil }, set: { if !$0 { summaryIndex = nil } })
        ) {
            if let index = summaryIndex, index < partySummaries.count {
                ReaderView(
                    item: .summary(partySummaries[index]), index: index, count: partySummaries.count,
                    onPrev: index > 0 ? { summaryIndex = index - 1 } : nil,
                    onNext: index + 1 < partySummaries.count ? { summaryIndex = index + 1 } : nil
                )
                .presentationDetents([.large, .medium])
                .presentationDragIndicator(.visible)
            }
        }
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
}
