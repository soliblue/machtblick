import SwiftUI

struct VoteResultTable: View {
    let model: VoteResultsModel

    var body: some View {
        ScrollView(.horizontal) {
            Grid(alignment: .trailing, horizontalSpacing: 0, verticalSpacing: 0) {
                GridRow {
                    Text(Copy.resultParty)
                        .foregroundStyle(ThemeColor.secondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.leading, ThemeTokens.Spacing.m)
                        .padding(.trailing, ThemeTokens.Spacing.s)
                    ForEach(model.columns) { column in
                        Text(column.shortLabel)
                            .foregroundStyle(column.color)
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
                    .gridCellUnsizedAxes(.horizontal)
                    .accessibilityHidden(true)
                ForEach(model.rows) { row in
                    GridRow {
                        VoteResultPartyCell(voteId: model.id, row: row)
                        ForEach(model.columns) { column in
                            VoteResultCountCell(
                                voteId: model.id, row: row, column: column,
                                isLastColumn: column == model.columns.last)
                        }
                    }
                    .background(row.party == nil ? ThemeColor.surface : .clear)
                    .accessibilityElement(children: .contain)
                    .accessibilityIdentifier("vote-result-row-\(model.id)-\(row.party.map(PartyStyle.slug) ?? "total")")
                    Rectangle()
                        .fill(ThemeColor.border)
                        .frame(height: ThemeTokens.Stroke.s)
                        .gridCellUnsizedAxes(.horizontal)
                        .accessibilityHidden(true)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Copy.resultSection)
        .accessibilityIdentifier("vote-results-\(model.id)")
    }
}
