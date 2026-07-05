import SwiftUI

struct VoteDonutView: View {
    let yes: Int
    let no: Int
    let abstain: Int
    let absent: Int
    var position: PartyPosition?
    var selected: VoteChoice?

    var body: some View {
        Canvas { context, size in
            let scale = size.width / 100
            let center = CGPoint(x: 50 * scale, y: 50 * scale)
            let outer = 46 * scale
            let counts = yes + no + abstain + absent
            let total = Double(max(counts, 1))
            if counts == 0, let stance = position {
                let dim = selected != nil && selected != stance.choice
                context.fill(
                    Path(
                        ellipseIn: CGRect(
                            x: center.x - outer, y: center.y - outer, width: 2 * outer, height: 2 * outer)),
                    with: .color(stance.color.opacity(dim ? 0.3 : 1)))
            }
            let segments: [(VoteChoice, Int, Color)] = [
                (.yes, yes, ThemeColor.success),
                (.no, no, ThemeColor.danger),
                (.abstain, abstain, ThemeColor.yellow),
                (.absent, absent, ThemeColor.fg.mix(with: ThemeColor.background, by: 0.75)),
            ]
            var start = -Double.pi / 2
            for (choice, value, baseColor) in segments where value > 0 {
                let dim = selected != nil && selected != choice
                let color = baseColor.opacity(dim ? 0.3 : 1)
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

extension PartyPosition {
    fileprivate var choice: VoteChoice? {
        switch self {
        case .yes: return .yes
        case .no: return .no
        case .abstain: return .abstain
        case .mixed, .split: return nil
        }
    }

    fileprivate var color: Color {
        switch self {
        case .yes: return ThemeColor.success
        case .no: return ThemeColor.danger
        case .abstain: return ThemeColor.yellow
        case .mixed, .split: return ThemeColor.fg.opacity(ThemeTokens.Opacity.m)
        }
    }
}
