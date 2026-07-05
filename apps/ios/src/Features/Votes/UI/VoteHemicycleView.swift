import SwiftUI

struct VoteHemicycleView: View {
    let yes: Int
    let no: Int
    let abstain: Int
    let absent: Int
    let total: Int
    var hero = false

    private static let radii = (0..<11).map { 54.0 + Double($0) * (145.0 - 54.0) / 10.0 }

    var body: some View {
        VStack(spacing: ThemeTokens.Spacing.s) {
            Canvas { context, size in
                let scale = size.width / 320
                for (index, seat) in HemicycleLayout.seats(total: total, radii: Self.radii, spread: .centered)
                    .enumerated()
                {
                    let x = (160 + cos(seat.angle) * seat.radius) * scale
                    let y = (158 - sin(seat.angle) * seat.radius) * scale
                    let r = 2.4 * scale
                    context.fill(
                        Path(ellipseIn: CGRect(x: x - r, y: y - r, width: 2 * r, height: 2 * r)),
                        with: .color(seatColor(at: index)))
                }
            }
            .aspectRatio(320.0 / 165.0, contentMode: .fit)
            HStack(alignment: .firstTextBaseline) {
                numeral(yes, color: ThemeColor.success)
                Spacer()
                numeral(no, color: ThemeColor.danger)
            }
        }
    }

    private func numeral(_ value: Int, color: Color) -> some View {
        Text("\(value)")
            .font(.display(hero ? 40 : 32))
            .foregroundStyle(color)
            .monospacedDigit()
    }

    private func seatColor(at index: Int) -> Color {
        let noData = max(0, total - yes - no - abstain - absent)
        if index < yes { return ThemeColor.success }
        if index < yes + abstain { return ThemeColor.fg.opacity(ThemeTokens.Opacity.m) }
        if index < yes + abstain + absent + noData { return ThemeColor.fg.opacity(ThemeTokens.Opacity.s) }
        return ThemeColor.danger
    }
}
