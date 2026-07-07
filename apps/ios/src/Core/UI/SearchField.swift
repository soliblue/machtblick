import SwiftUI

struct SearchField: View {
    let placeholder: String
    @Binding var text: String

    var body: some View {
        HStack(spacing: ThemeTokens.Spacing.s) {
            Image(systemName: "magnifyingglass").font(.system(size: ThemeTokens.Icon.s))
                .foregroundStyle(ThemeColor.secondary)
            TextField(placeholder, text: $text)
                .font(.system(size: ThemeTokens.Text.m))
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
        }
        .padding(.horizontal, ThemeTokens.Spacing.m)
        .padding(.vertical, ThemeTokens.Spacing.s)
        .background(RoundedRectangle(cornerRadius: ThemeTokens.Radius.m).fill(ThemeColor.surface))
    }
}
