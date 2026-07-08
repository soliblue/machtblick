import SwiftUI

struct TopicChip: View {
    let text: String
    var outlined = false
    var danger = false

    var body: some View {
        Text(text)
            .lineLimit(1)
            .fixedSize()
            .font(.system(size: ThemeTokens.Text.s, weight: outlined ? .semibold : .regular))
            .textCase(outlined ? .uppercase : nil)
            .tracking(outlined ? 0.9 : 0)
            .foregroundStyle(danger ? ThemeColor.danger : ThemeColor.secondary)
            .padding(.horizontal, ThemeTokens.Spacing.s)
            .padding(.vertical, 2)
            .overlay(
                Rectangle().strokeBorder(
                    danger ? ThemeColor.danger.opacity(0.5) : ThemeColor.border, lineWidth: ThemeTokens.Stroke.s))
    }
}
