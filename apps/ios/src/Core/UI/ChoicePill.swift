import SwiftUI

struct ChoicePill: View {
    let label: String
    var fill: Color?
    var textColor: Color = ThemeColor.background

    var body: some View {
        Text(label)
            .tracking(0.9)
            .font(.system(size: 11, weight: .semibold))
            .textCase(.uppercase)
            .foregroundStyle(fill == nil ? ThemeColor.secondary : textColor)
            .padding(.horizontal, ThemeTokens.Spacing.s)
            .padding(.vertical, 2)
            .background(fill ?? Color.clear)
            .overlay {
                if fill == nil {
                    Rectangle().strokeBorder(ThemeColor.secondary, lineWidth: ThemeTokens.Stroke.s)
                }
            }
    }
}
