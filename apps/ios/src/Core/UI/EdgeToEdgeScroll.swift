import SwiftUI

extension View {
    func edgeToEdgeScroll(inset: CGFloat = ThemeTokens.Spacing.l) -> some View {
        self
            .padding(.horizontal, -inset)
            .contentMargins(.horizontal, inset, for: .scrollContent)
    }
}
