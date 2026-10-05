import SwiftUI

struct VoteResultCountCell: View {
    let voteId: String
    let row: VoteResultRow
    let column: VoteResultColumn
    var isLastColumn = false

    var body: some View {
        Group {
            if let count = row.count(column) {
                Text("\(count)")
                    .font(row.party == nil ? .display(ThemeTokens.Text.xl) : .system(size: ThemeTokens.Text.m))
                    .foregroundStyle(count == 0 ? ThemeColor.fg.opacity(ThemeTokens.Opacity.m) : column.color)
                    .monospacedDigit()
            } else {
                Text(Copy.resultUnavailableShort)
                    .font(.system(size: ThemeTokens.Text.s))
                    .foregroundStyle(ThemeColor.secondary)
            }
        }
        .fixedSize(horizontal: true, vertical: false)
        .frame(maxWidth: .infinity, alignment: .trailing)
        .padding(.leading, ThemeTokens.Spacing.xs)
        .padding(.trailing, isLastColumn ? ThemeTokens.Spacing.xl : ThemeTokens.Spacing.xs)
        .padding(.vertical, ThemeTokens.Spacing.l)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(row.party.map(PartyStyle.label) ?? Copy.resultTotal), \(column.label)")
        .accessibilityValue(row.count(column).map { String($0) } ?? Copy.resultUnavailable)
        .accessibilityIdentifier("vote-result-cell-\(voteId)-\(row.party.map(PartyStyle.slug) ?? "total")-\(column.rawValue)")
    }
}
