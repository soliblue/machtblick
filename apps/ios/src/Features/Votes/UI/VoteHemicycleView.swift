import SwiftUI

struct VoteHemicycleView: View {
    let yes: Int
    let no: Int
    let abstain: Int
    let absent: Int
    let total: Int
    var hero = false
    var selected: VoteChoice?
    var onSelect: ((VoteChoice) -> Void)?

    private static let radii = (0..<11).map { 54.0 + Double($0) * (145.0 - 54.0) / 10.0 }

    var body: some View {
        VStack(spacing: ThemeTokens.Spacing.m) {
            Canvas { context, size in
                let scale = size.width / 320
                for (index, seat) in HemicycleLayout.seats(total: total, radii: Self.radii, spread: .centered)
                    .enumerated()
                {
                    let x = (160 + cos(seat.angle) * seat.radius) * scale
                    let y = (158 - sin(seat.angle) * seat.radius) * scale
                    let r = 2.4 * scale
                    let choice = seatChoice(at: index)
                    let dim = selected != nil && selected != choice
                    context.fill(
                        Path(ellipseIn: CGRect(x: x - r, y: y - r, width: 2 * r, height: 2 * r)),
                        with: .color(seatColor(choice).opacity(dim ? ThemeTokens.Opacity.s : 1)))
                }
            }
            .aspectRatio(320.0 / 165.0, contentMode: .fit)
            HStack(alignment: .bottom) {
                legendNumeral(Copy.yes, value: yes, color: ThemeColor.success, choice: .yes)
                Spacer()
                VStack(spacing: ThemeTokens.Spacing.xs) {
                    if abstain > 0 {
                        legendLine("\(abstain) \(Copy.abstain)", choice: .abstain)
                    }
                    if absent > 0 {
                        legendLine("\(absent) \(Copy.absent)", choice: .absent)
                    }
                }
                Spacer()
                legendNumeral(Copy.no, value: no, color: ThemeColor.danger, choice: .no)
            }
        }
    }

    @ViewBuilder private func legendNumeral(_ label: String, value: Int, color: Color, choice: VoteChoice)
        -> some View
    {
        let dim = selected != nil && selected != choice
        let block = VStack(alignment: choice == .yes ? .leading : .trailing, spacing: ThemeTokens.Spacing.xs) {
            Text(label).kicker()
            Text("\(value)")
                .font(.display(hero ? ThemeTokens.Display.hero : ThemeTokens.Display.poster))
                .foregroundStyle(color)
                .monospacedDigit()
        }
        .opacity(dim ? ThemeTokens.Opacity.m : 1)
        if let onSelect {
            Button { onSelect(choice) } label: { block }.buttonStyle(.plain)
        } else {
            block
        }
    }

    @ViewBuilder private func legendLine(_ text: String, choice: VoteChoice) -> some View {
        let dim = selected != nil && selected != choice
        let label = Text(text)
            .font(.system(size: ThemeTokens.Text.s))
            .foregroundStyle(ThemeColor.secondary)
            .opacity(dim ? ThemeTokens.Opacity.m : 1)
        if let onSelect {
            Button { onSelect(choice) } label: { label }.buttonStyle(.plain)
        } else {
            label
        }
    }

    private func seatChoice(at index: Int) -> VoteChoice {
        let noData = max(0, total - yes - no - abstain - absent)
        if index < yes { return .yes }
        if index < yes + abstain { return .abstain }
        if index < yes + abstain + absent + noData { return .absent }
        return .no
    }

    private func seatColor(_ choice: VoteChoice) -> Color {
        switch choice {
        case .yes: return ThemeColor.success
        case .no: return ThemeColor.danger
        case .abstain: return ThemeColor.fg.opacity(ThemeTokens.Opacity.m)
        case .absent: return ThemeColor.fg.opacity(ThemeTokens.Opacity.s)
        }
    }
}
