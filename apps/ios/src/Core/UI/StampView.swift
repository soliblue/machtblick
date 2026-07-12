import SwiftUI

struct StampView: View {
    @Environment(\.colorScheme) private var colorScheme

    let label: String
    let color: Color
    var rotation: Double = 0

    private let fontSize = ThemeTokens.Text.s - 2

    var body: some View {
        Text(label)
            .tracking(fontSize * 0.12)
            .font(.system(size: fontSize, weight: .semibold))
            .textCase(.uppercase)
            .lineLimit(1)
            .fixedSize()
            .foregroundStyle(color.mix(with: ThemeColor.fg, by: 0.55))
            .padding(.horizontal, ThemeTokens.Spacing.s)
            .padding(.vertical, ThemeTokens.Spacing.xs)
            .overlay(Rectangle().strokeBorder(color, lineWidth: 2.5))
            .overlay(Rectangle().stroke(color, lineWidth: ThemeTokens.Stroke.s).padding(-3))
            .overlay {
                Canvas { context, size in
                    var rng = StampNoise(seed: UInt64(bitPattern: Int64(label.hashValue)))
                    for _ in 0..<Int(size.width * size.height / 24) {
                        let x = Double.random(in: 0...size.width, using: &rng)
                        let y = Double.random(in: 0...size.height, using: &rng)
                        let r = Double.random(in: 0.3...1.4, using: &rng)
                        context.fill(
                            Path(ellipseIn: CGRect(x: x, y: y, width: r, height: r)),
                            with: .color(.black))
                    }
                }
                .blendMode(.destinationOut)
            }
            .compositingGroup()
            .opacity(0.85)
            .blendMode(colorScheme == .dark ? .normal : .multiply)
            .rotationEffect(.degrees(rotation))
    }
}

private struct StampNoise: RandomNumberGenerator {
    private var state: UInt64

    init(seed: UInt64) {
        state = seed == 0 ? 0x9E37_79B9_7F4A_7C15 : seed
    }

    mutating func next() -> UInt64 {
        state &+= 0x9E37_79B9_7F4A_7C15
        var z = state
        z = (z ^ (z >> 30)) &* 0xBF58_476D_1CE4_E5B9
        z = (z ^ (z >> 27)) &* 0x94D0_49BB_1331_11EB
        return z ^ (z >> 31)
    }
}
