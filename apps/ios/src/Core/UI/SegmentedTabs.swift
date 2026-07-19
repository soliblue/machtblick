import SwiftUI

struct SegmentedTabs<Tab: Hashable>: View {
    let tabs: [Tab]
    let label: (Tab) -> String

    @Binding var selection: Tab

    var body: some View {
        HStack(spacing: ThemeTokens.Spacing.xs) {
            ForEach(tabs, id: \.self) { tab in
                Button { selection = tab } label: {
                    Text(label(tab))
                        .font(.system(size: ThemeTokens.Text.m, weight: tab == selection ? .semibold : .regular))
                        .foregroundStyle(ThemeColor.fg)
                        .opacity(tab == selection ? 1 : ThemeTokens.Opacity.l)
                        .lineLimit(1)
                        .frame(maxWidth: .infinity)
                        .padding(.horizontal, ThemeTokens.Spacing.s)
                        .padding(.vertical, ThemeTokens.Spacing.s)
                        .background {
                            if tab == selection {
                                RoundedRectangle(cornerRadius: ThemeTokens.Radius.m - ThemeTokens.Spacing.xs)
                                    .fill(ThemeColor.background)
                                    .shadow(color: Color(hex: 0x0A0A0A, alpha: 0.08), radius: 1, y: 1)
                            }
                        }
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
        }
        .padding(ThemeTokens.Spacing.xs)
        .background(ThemeColor.surface, in: RoundedRectangle(cornerRadius: ThemeTokens.Radius.m))
        .overlay(RoundedRectangle(cornerRadius: ThemeTokens.Radius.m).strokeBorder(ThemeColor.border, lineWidth: ThemeTokens.Stroke.s))
    }
}
