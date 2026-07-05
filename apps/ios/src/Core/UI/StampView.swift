import SwiftUI

struct StampView: View {
    let label: String
    let color: Color
    var rotation: Double = 0

    var body: some View {
        Text(label)
            .tracking(1.4)
            .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
            .textCase(.uppercase)
            .foregroundStyle(color.mix(with: ThemeColor.fg, by: 0.55))
            .padding(.horizontal, ThemeTokens.Spacing.s)
            .padding(.vertical, ThemeTokens.Spacing.xs)
            .overlay(Rectangle().strokeBorder(color, lineWidth: 2.5))
            .overlay(Rectangle().stroke(color, lineWidth: ThemeTokens.Stroke.s).padding(-3))
            .opacity(0.85)
            .rotationEffect(.degrees(rotation))
    }
}
