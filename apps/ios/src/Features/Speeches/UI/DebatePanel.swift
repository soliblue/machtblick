import SwiftUI

struct DebatePanel: View {
    let speeches: [SpeechSummary]
    let partySummaries: [PartySummaryReader]
    @State private var query = ""

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.l) {
            PartySummaryStrip(summaries: partySummaries, speeches: speeches)
            Text(Copy.debateTimeline).kicker()
            SearchField(placeholder: Copy.searchSpeeches, text: $query)
            if filtered.isEmpty {
                Text(Copy.noSpeechesFound)
                    .font(.system(size: ThemeTokens.Text.m))
                    .foregroundStyle(ThemeColor.secondary)
                    .padding(.vertical, ThemeTokens.Spacing.l)
            } else {
                ConversationThread(speeches: filtered, terms: terms)
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
