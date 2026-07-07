import SwiftUI

struct ChatInboxRow: View {
    let group: MemberSpeechGroup
    var showDivider = true

    var body: some View {
        HStack(alignment: .top, spacing: ThemeTokens.Spacing.m) {
            glyph
            VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
                HStack(alignment: .firstTextBaseline, spacing: ThemeTokens.Spacing.s) {
                    Text(group.title)
                        .font(.display(ThemeTokens.Text.l))
                        .foregroundStyle(ThemeColor.fg)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                    Spacer(minLength: ThemeTokens.Spacing.s)
                    Text(Formatters.shortDate(group.date))
                        .font(.system(size: ThemeTokens.Text.s))
                        .foregroundStyle(ThemeColor.secondary)
                        .fixedSize()
                }
                Text(group.main.excerpt)
                    .font(.serif(ThemeTokens.Text.m))
                    .foregroundStyle(ThemeColor.secondary)
                    .lineLimit(1)
                    .multilineTextAlignment(.leading)
                Text("\(group.speeches.count) \(Copy.contributions)")
                    .font(.system(size: ThemeTokens.Text.s))
                    .foregroundStyle(ThemeColor.secondary)
            }
        }
        .padding(.vertical, ThemeTokens.Spacing.m)
        .frame(maxWidth: .infinity, alignment: .leading)
        .contentShape(Rectangle())
        .overlay(alignment: .top) {
            if showDivider {
                Rectangle().fill(ThemeColor.border).frame(height: ThemeTokens.Stroke.s)
            }
        }
    }

    private var glyph: some View {
        Image(systemName: "bubble.left.and.bubble.right.fill")
            .font(.system(size: ThemeTokens.Icon.m))
            .foregroundStyle(ThemeColor.secondary)
            .frame(width: 40, height: 40)
            .background(RoundedRectangle(cornerRadius: ThemeTokens.Radius.m).fill(ThemeColor.surface))
    }
}
