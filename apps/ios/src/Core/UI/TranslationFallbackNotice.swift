import SwiftUI

struct TranslationFallbackNotice: View {
    var body: some View {
        if AppLocale.current == .en {
            Label(Copy.translationFallbackNotice, systemImage: "text.bubble")
                .font(.system(size: ThemeTokens.Text.s))
                .foregroundStyle(ThemeColor.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}
