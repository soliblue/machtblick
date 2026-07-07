import SwiftUI

struct DebateThreadView: View {
    let rows: [DebateThreadRow]
    var terms: [String] = []
    let onOpenTurn: (Int) -> Void

    var body: some View {
        ZStack(alignment: .topLeading) {
            Rectangle()
                .fill(ThemeColor.border)
                .frame(width: 1)
                .padding(.leading, 17)
                .padding(.top, ThemeTokens.Spacing.xl + 18)
            VStack(alignment: .leading, spacing: 0) {
                ForEach(rows) { row in
                    switch row {
                    case .system(let speech):
                        SpeechSystemRow(speech: speech)
                    case .turn(let speech, let nested, let compact, let turnIndex):
                        if compact {
                            CompactTurnRow(speech: speech, terms: terms) { onOpenTurn(turnIndex) }
                        } else {
                            SpeechEntry(speech: speech, nested: nested, terms: terms) { onOpenTurn(turnIndex) }
                        }
                    }
                }
            }
        }
    }
}
