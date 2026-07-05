import SwiftUI

struct PieDonutView: View {
    let title: String
    let slices: [PieSlice]
    @State private var selected: Int?

    private var total: Int { slices.reduce(0) { $0 + $1.value } }

    private var activeIndex: Int {
        selected ?? slices.indices.max(by: { slices[$0].value < slices[$1].value }) ?? 0
    }

    var body: some View {
        VStack(spacing: ThemeTokens.Spacing.s) {
            ZStack {
                Canvas { context, size in draw(&context, size) }
                if total > 0 {
                    VStack(spacing: 0) {
                        Text("\(shownPct)%")
                            .font(.system(size: ThemeTokens.Text.l, weight: .semibold))
                            .monospacedDigit()
                        Text(slices[activeIndex].label)
                            .font(.system(size: 9))
                            .foregroundStyle(ThemeColor.secondary)
                            .lineLimit(1)
                    }
                } else {
                    Text(Copy.noData)
                        .font(.system(size: ThemeTokens.Text.s))
                        .foregroundStyle(ThemeColor.secondary)
                }
            }
            .aspectRatio(1, contentMode: .fit)
            .frame(maxWidth: 130)
            .contentShape(Rectangle())
            .onTapGesture { cycle() }
            Text(title).kicker()
        }
    }

    private var shownPct: Int {
        let value = slices[activeIndex].value
        return value == total ? 100 : min(99, Int((Double(value) / Double(max(total, 1)) * 100).rounded()))
    }

    private func cycle() {
        guard !slices.isEmpty else { return }
        selected = (activeIndex + 1) % slices.count
    }

    private func draw(_ context: inout GraphicsContext, _ size: CGSize) {
        guard total > 0 else { return }
        let scale = size.width / 100
        let center = CGPoint(x: 50 * scale, y: 50 * scale)
        let outer = 46 * scale
        var start = -Double.pi / 2
        for (index, slice) in slices.enumerated() {
            let sweep = Double(slice.value) / Double(total) * 2 * .pi
            let active = index == activeIndex
            let mid = start + sweep / 2
            let offset = active ? 4 * scale : 0
            let c = CGPoint(x: center.x + cos(mid) * offset, y: center.y + sin(mid) * offset)
            let color = slice.color.opacity(active ? 1 : 0.3)
            if sweep >= 2 * .pi - 0.0001 {
                context.fill(
                    Path(ellipseIn: CGRect(x: c.x - outer, y: c.y - outer, width: 2 * outer, height: 2 * outer)),
                    with: .color(color))
            } else {
                var path = Path()
                path.move(to: c)
                path.addArc(
                    center: c, radius: outer, startAngle: .radians(start), endAngle: .radians(start + sweep),
                    clockwise: false)
                path.closeSubpath()
                context.fill(path, with: .color(color))
                context.stroke(path, with: .color(ThemeColor.background), lineWidth: 2 * scale)
            }
            start += sweep
        }
        let hole = 28 * scale
        context.fill(
            Path(ellipseIn: CGRect(x: center.x - hole, y: center.y - hole, width: 2 * hole, height: 2 * hole)),
            with: .color(ThemeColor.background))
    }
}
