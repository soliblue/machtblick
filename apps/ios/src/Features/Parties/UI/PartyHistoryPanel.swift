import SwiftUI

struct PartyHistoryPanel: View {
    let history: PartyHistory
    let party: String

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.l) {
            HStack(alignment: .firstTextBaseline) {
                Text(Copy.shareOfBundestag).kicker()
                Spacer()
                if let first = history.chartPoints.first {
                    Text(range(first.year))
                        .font(.system(size: ThemeTokens.Text.s))
                        .foregroundStyle(ThemeColor.secondary)
                }
            }
            PartyHistoryChart(history: history, party: party)
        }
    }

    private func range(_ year: Int) -> String {
        "\(year) - \(Copy.sinceToday)"
    }
}
