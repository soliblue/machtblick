import SwiftUI

struct BrandWordmark: View {
    let scroll: ScrollPositionModel
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var morph: Double { reduceMotion ? 0 : min(1, max(0, scroll.y / 140)) }
    private var pupilX: Double { reduceMotion ? 0 : sin(scroll.y / 280) * 2.5 }
    private var pupilY: Double { reduceMotion ? 0 : cos(scroll.y / 360) * 1.6 + morph * 1.1 }

    var body: some View {
        Button {
            withAnimation { scroll.position.scrollTo(edge: .top) }
        } label: {
            ZStack(alignment: .leading) {
                Text("Machtblick")
                    .font(.display(ThemeTokens.Text.xl))
                    .foregroundStyle(ThemeColor.fg)
                    .opacity(1 - morph)
                    .scaleEffect(1 - morph * 0.28, anchor: .leading)
                    .offset(x: morph * -6)
                EyesLogo(height: 20, pupilX: pupilX, pupilY: pupilY)
                    .opacity(morph)
                    .scaleEffect(0.78 + morph * 0.22, anchor: .leading)
            }
            .frame(height: 24, alignment: .leading)
            .fixedSize()
        }
        .buttonStyle(.plain)
        .accessibilityLabel(Copy.scrollToTop)
        .accessibilityIdentifier("scroll-to-top")
    }
}
