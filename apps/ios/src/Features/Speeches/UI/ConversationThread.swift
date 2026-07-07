import SwiftUI

struct ConversationThread: View {
    let speeches: [SpeechSummary]
    @State private var expanded: Set<String> = []

    var body: some View {
        LazyVStack(alignment: .leading, spacing: ThemeTokens.Spacing.l) {
            ForEach(rows) { row in
                switch row {
                case .system(let speech):
                    ConversationSystemChip(speech: speech)
                case .turn(let speech, let nested, _, _):
                    ConversationBubble(
                        speech: speech, trailing: false, maxWidth: .infinity,
                        expanded: expanded.contains(speech.id)
                    ) {
                        expanded.insert(speech.id)
                    }
                    .padding(.leading, nested ? ThemeTokens.Spacing.xl : 0)
                    .padding(.trailing, ThemeTokens.Spacing.xl)
                }
            }
        }
    }

    private var rows: [DebateThreadRow] {
        DebateThreadBuilder.rows(from: speeches)
    }
}
