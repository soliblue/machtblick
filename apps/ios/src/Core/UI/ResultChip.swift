import SwiftUI

struct ResultChip: View {
    let result: VoteResult
    var date: String?

    var body: some View {
        HStack(spacing: ThemeTokens.Spacing.xs) {
            Rectangle().fill(result.color).frame(width: 6, height: 6)
            Text(dateText.isEmpty ? result.label : "\(result.label) · \(dateText)")
                .font(.system(size: ThemeTokens.Text.s))
                .foregroundStyle(ThemeColor.secondary)
        }
    }

    private var dateText: String {
        date.map(Formatters.shortDate) ?? ""
    }
}
