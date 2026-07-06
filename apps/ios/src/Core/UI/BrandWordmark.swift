import SwiftUI

struct BrandWordmark: View {
    var progress: Double = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var morph: Double { reduceMotion ? 0 : min(1, max(0, progress)) }

    var body: some View {
        ZStack(alignment: .leading) {
            Text("Machtblick")
                .font(.display(ThemeTokens.Text.xl))
                .foregroundStyle(ThemeColor.fg)
                .opacity(1 - morph)
                .scaleEffect(1 - morph * 0.28, anchor: .leading)
                .offset(x: morph * -6)
            EyesLogo(height: 20, pupilDrift: morph)
                .opacity(morph)
                .scaleEffect(0.78 + morph * 0.22, anchor: .leading)
        }
        .frame(height: 24, alignment: .leading)
        .fixedSize()
        .accessibilityElement()
        .accessibilityLabel("Machtblick")
    }
}
