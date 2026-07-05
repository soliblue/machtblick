import SwiftUI

struct VoteDonutView: View {
    let yes: Int
    let no: Int
    let abstain: Int
    let absent: Int

    var body: some View {
        Canvas { context, size in
            let scale = size.width / 100
            let center = CGPoint(x: 50 * scale, y: 50 * scale)
            let outer = 46 * scale
            let total = Double(max(yes + no + abstain + absent, 1))
            let segments: [(Int, Color)] = [
                (yes, ThemeColor.success),
                (no, ThemeColor.danger),
                (abstain, ThemeColor.yellow),
                (absent, ThemeColor.fg.mix(with: ThemeColor.background, by: 0.75)),
            ]
            var start = -Double.pi / 2
            for (value, color) in segments where value > 0 {
                let sweep = Double(value) / total * 2 * .pi
                if sweep >= 2 * .pi - 0.0001 {
                    context.fill(
                        Path(
                            ellipseIn: CGRect(
                                x: center.x - outer, y: center.y - outer, width: 2 * outer, height: 2 * outer)),
                        with: .color(color))
                } else {
                    var path = Path()
                    path.move(to: center)
                    path.addArc(
                        center: center, radius: outer, startAngle: .radians(start),
                        endAngle: .radians(start + sweep), clockwise: false)
                    path.closeSubpath()
                    context.fill(path, with: .color(color))
                    context.stroke(path, with: .color(ThemeColor.background), lineWidth: 2 * scale)
                }
                start += sweep
            }
            let hole = 22 * scale
            context.fill(
                Path(ellipseIn: CGRect(x: center.x - hole, y: center.y - hole, width: 2 * hole, height: 2 * hole)),
                with: .color(ThemeColor.background))
        }
        .aspectRatio(1, contentMode: .fit)
    }
}
