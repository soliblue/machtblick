import SwiftUI

struct MemberVoteConnector: View {
    let anchors: PartyDonutConnectorAnchors
    let proxy: GeometryProxy
    let memberChoice: BallotChoice
    let partyMajority: BallotChoice?
    let deviation: Bool

    var body: some View {
        Canvas { context, _ in
            if let status = anchors.status, let target = anchors.target, let partyMajority {
                let geometry = MemberVoteConnectorGeometry(
                    start: proxy[status],
                    target: proxy[target]
                )
                if deviation {
                    stroke(geometry.leadingPath, color: memberChoice.color, context: &context)
                    stroke(geometry.trailingPath, color: partyMajority.color, context: &context)
                    stroke(geometry.lightningPath, color: ThemeColor.danger, context: &context)
                } else {
                    stroke(geometry.continuousPath, color: partyMajority.color, context: &context)
                }
                stroke(geometry.arrowPath, color: partyMajority.color, context: &context)
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }

    private func stroke(_ path: Path, color: Color, context: inout GraphicsContext) {
        context.stroke(
            path,
            with: .color(color),
            style: StrokeStyle(
                lineWidth: ThemeTokens.Stroke.m,
                lineCap: .round,
                lineJoin: .round
            )
        )
    }
}

private struct MemberVoteConnectorGeometry {
    let start: CGPoint
    let target: CGPoint

    private var bendY: CGFloat {
        start.y + min(
            max((target.y - start.y) / 2, ThemeTokens.Spacing.s),
            ThemeTokens.Spacing.l
        )
    }

    private var lineEndY: CGFloat {
        target.y - ThemeTokens.Spacing.xs
    }

    private var breaksHorizontally: Bool {
        abs(target.x - start.x) > ThemeTokens.Spacing.m
    }

    private var breakPoint: CGPoint {
        breaksHorizontally
            ? CGPoint(x: (start.x + target.x) / 2, y: bendY)
            : CGPoint(x: target.x, y: (bendY + lineEndY) / 2)
    }

    var continuousPath: Path {
        var path = Path()
        path.move(to: start)
        path.addLine(to: CGPoint(x: start.x, y: bendY))
        path.addLine(to: CGPoint(x: target.x, y: bendY))
        path.addLine(to: CGPoint(x: target.x, y: lineEndY))
        return path
    }

    var leadingPath: Path {
        var path = Path()
        path.move(to: start)
        path.addLine(to: CGPoint(x: start.x, y: bendY))
        if breaksHorizontally {
            path.addLine(
                to: CGPoint(
                    x: breakPoint.x - (target.x > start.x ? ThemeTokens.Spacing.xs : -ThemeTokens.Spacing.xs),
                    y: bendY
                )
            )
        } else {
            path.addLine(to: CGPoint(x: target.x, y: bendY))
            path.addLine(to: CGPoint(x: target.x, y: breakPoint.y - ThemeTokens.Spacing.xs))
        }
        return path
    }

    var trailingPath: Path {
        var path = Path()
        if breaksHorizontally {
            path.move(
                to: CGPoint(
                    x: breakPoint.x + (target.x > start.x ? ThemeTokens.Spacing.xs : -ThemeTokens.Spacing.xs),
                    y: bendY
                )
            )
            path.addLine(to: CGPoint(x: target.x, y: bendY))
        } else {
            path.move(to: CGPoint(x: target.x, y: breakPoint.y + ThemeTokens.Spacing.xs))
        }
        path.addLine(to: CGPoint(x: target.x, y: lineEndY))
        return path
    }

    var lightningPath: Path {
        var path = Path()
        path.move(
            to: CGPoint(
                x: breakPoint.x + ThemeTokens.Stroke.m,
                y: breakPoint.y - ThemeTokens.Spacing.xs))
        path.addLine(
            to: CGPoint(
                x: breakPoint.x - ThemeTokens.Stroke.l,
                y: breakPoint.y - ThemeTokens.Stroke.s / 2))
        path.addLine(to: CGPoint(x: breakPoint.x + ThemeTokens.Stroke.s, y: breakPoint.y))
        path.addLine(
            to: CGPoint(
                x: breakPoint.x - ThemeTokens.Stroke.m,
                y: breakPoint.y + ThemeTokens.Spacing.xs))
        return path
    }

    var arrowPath: Path {
        var path = Path()
        path.move(to: CGPoint(x: target.x - ThemeTokens.Spacing.xs, y: lineEndY - ThemeTokens.Spacing.xs))
        path.addLine(to: CGPoint(x: target.x, y: lineEndY))
        path.addLine(to: CGPoint(x: target.x + ThemeTokens.Spacing.xs, y: lineEndY - ThemeTokens.Spacing.xs))
        return path
    }
}
