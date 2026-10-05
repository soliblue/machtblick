import SwiftUI

struct VoteResultTableLayout: Layout {
    let columns: Int
    let minimumWidth: CGFloat

    struct Cache {
        let widths: [CGFloat]
        let heights: [CGFloat]
    }

    func makeCache(subviews: Subviews) -> Cache {
        let sizes = subviews.map { $0.sizeThatFits(.unspecified) }
        return Cache(
            widths: (0..<columns).map { column in
                stride(from: column, to: sizes.count, by: columns + 1)
                    .map { sizes[$0].width }.max() ?? 0
            },
            heights: stride(from: 0, to: sizes.count, by: columns + 1).map { row in
                (row..<(row + columns)).map { sizes[$0].height }.max() ?? 0
            })
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout Cache) -> CGSize {
        CGSize(
            width: max(
                minimumWidth,
                max(proposal.width.map { $0.isFinite ? $0 : 0 } ?? 0, cache.widths.reduce(0, +))),
            height: cache.heights.reduce(0, +) + CGFloat(cache.heights.count) * ThemeTokens.Stroke.s)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout Cache) {
        let spare = max(0, bounds.width - cache.widths.reduce(0, +)) / CGFloat(columns)
        var y = bounds.minY
        for row in cache.heights.indices {
            var x = bounds.minX
            for column in cache.widths.indices {
                let width = cache.widths[column] + spare
                subviews[row * (columns + 1) + column].place(
                    at: CGPoint(x: x + width, y: y + cache.heights[row] / 2), anchor: .trailing,
                    proposal: ProposedViewSize(width: width, height: cache.heights[row]))
                x += width
            }
            y += cache.heights[row]
            subviews[row * (columns + 1) + columns].place(
                at: CGPoint(x: bounds.minX, y: y), anchor: .topLeading,
                proposal: ProposedViewSize(width: bounds.width, height: ThemeTokens.Stroke.s))
            y += ThemeTokens.Stroke.s
        }
    }
}
