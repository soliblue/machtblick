import SwiftUI

struct PosterStatBar: View {
    let label: String
    let value: Double
    var sub: (text: String, danger: Bool)?
    var info: (() -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
            HStack(spacing: ThemeTokens.Spacing.xs) {
                Text(label).kicker()
                if let info {
                    Button(action: info) {
                        Image(systemName: "info.circle").font(.system(size: ThemeTokens.Text.s))
                            .foregroundStyle(ThemeColor.secondary)
                    }
                    .buttonStyle(.plain)
                }
            }
            Text(Formatters.percent(value))
                .font(.display(32))
                .monospacedDigit()
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle().fill(ThemeColor.border)
                    Rectangle().fill(ThemeColor.success)
                        .frame(width: geo.size.width * min(max(value, 0), 1))
                }
            }
            .frame(height: 6)
            if let sub {
                Text(sub.text)
                    .font(.system(size: ThemeTokens.Text.s, weight: sub.danger ? .semibold : .regular))
                    .foregroundStyle(sub.danger ? ThemeColor.danger : ThemeColor.secondary)
            }
        }
    }
}
