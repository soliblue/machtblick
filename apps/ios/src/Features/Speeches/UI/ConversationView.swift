import SwiftUI

struct ConversationView: View {
    let speeches: [SpeechSummary]
    @Environment(\.dismiss) private var dismiss
    @State private var expanded: Set<String> = []

    var body: some View {
        NavigationStack {
            GeometryReader { proxy in
                ScrollView {
                    LazyVStack(spacing: ThemeTokens.Spacing.l) {
                        ForEach(rows) { row in
                            switch row {
                            case .system(let speech):
                                ConversationSystemChip(speech: speech)
                            case .turn(let speech, let nested, _, _):
                                bubble(speech: speech, nested: nested, width: proxy.size.width)
                            }
                        }
                    }
                    .padding(.vertical, ThemeTokens.Spacing.l)
                }
            }
            .background(ThemeColor.background)
            .navigationTitle(Copy.conversation)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark").font(.system(size: ThemeTokens.Icon.m))
                    }
                    .foregroundStyle(ThemeColor.secondary)
                }
            }
        }
    }

    private func bubble(speech: SpeechSummary, nested: Bool, width: CGFloat) -> some View {
        let trailing = speech.choice == .ja
        return ConversationBubble(
            speech: speech, trailing: trailing, maxWidth: width * 0.78,
            expanded: expanded.contains(speech.id)
        ) {
            expanded.insert(speech.id)
        }
        .padding(.horizontal, ThemeTokens.Spacing.l)
        .padding(.leading, nested && !trailing ? ThemeTokens.Spacing.xl : 0)
        .padding(.trailing, nested && trailing ? ThemeTokens.Spacing.xl : 0)
    }

    private var rows: [DebateThreadRow] {
        DebateThreadBuilder.rows(from: speeches)
    }
}
