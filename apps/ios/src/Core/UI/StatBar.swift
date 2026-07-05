import SwiftUI

struct StatBar: View {
    let label: String
    let value: Double

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
            HStack(alignment: .firstTextBaseline) {
                Text(label).kicker()
                Spacer()
                Text(Formatters.percent(value))
                    .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                    .monospacedDigit()
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle().fill(ThemeColor.border)
                    Rectangle().fill(ThemeColor.success)
                        .frame(width: geo.size.width * min(max(value, 0), 1))
                }
            }
            .frame(height: 3)
        }
    }
}
