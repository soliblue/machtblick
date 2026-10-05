import SwiftUI

struct VoteResultTable: View {
    let model: VoteResultsModel
    @State private var viewportWidth: CGFloat = 0

    var body: some View {
        ScrollView(.horizontal) {
            VoteResultTableLayout(columns: model.columns.count + 1, minimumWidth: viewportWidth) {
                Group {
                    Text(Copy.resultParty)
                        .foregroundStyle(ThemeColor.secondary)
                        .fixedSize(horizontal: true, vertical: false)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.leading, ThemeTokens.Spacing.m)
                        .padding(.trailing, ThemeTokens.Spacing.s)
                    ForEach(model.columns) { column in
                        Text(column.shortLabel)
                            .foregroundStyle(column.color)
                            .fixedSize(horizontal: true, vertical: false)
                            .padding(.leading, ThemeTokens.Spacing.xs)
                            .padding(.trailing, column == model.columns.last ? ThemeTokens.Spacing.xl : ThemeTokens.Spacing.xs)
                            .accessibilityLabel(column.label)
                    }
                }
                .font(.system(size: ThemeTokens.Text.s))
                .padding(.vertical, ThemeTokens.Spacing.m)
                Rectangle()
                    .fill(ThemeColor.border)
                    .frame(height: ThemeTokens.Stroke.s)
                    .accessibilityHidden(true)
                ForEach(model.rows) { row in
                    Group {
                        VoteResultPartyCell(voteId: model.id, row: row)
                        ForEach(model.columns) { column in
                            VoteResultCountCell(
                                voteId: model.id, row: row, column: column,
                                isLastColumn: column == model.columns.last)
                        }
                    }
                    .background(row.party == nil ? ThemeColor.surface : .clear)
                    Rectangle()
                        .fill(ThemeColor.border)
                        .frame(height: ThemeTokens.Stroke.s)
                        .accessibilityHidden(true)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .onGeometryChange(for: CGFloat.self) { $0.size.width } action: { viewportWidth = $0 }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Copy.resultSection)
        .accessibilityIdentifier("vote-results-\(model.id)")
    }
}
