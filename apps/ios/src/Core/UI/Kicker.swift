import SwiftUI

extension Text {
    func kicker() -> some View {
        tracking(0.96)
            .font(.system(size: ThemeTokens.Text.s))
            .textCase(.uppercase)
            .foregroundStyle(ThemeColor.secondary)
    }
}
