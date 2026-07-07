import SwiftUI

struct PartyCardView: View {
    let party: PartyListItem
    let totalSeats: Int

    var body: some View {
        VStack(spacing: 0) {
            HStack(alignment: .top, spacing: ThemeTokens.Spacing.m) {
                VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
                    HStack(spacing: ThemeTokens.Spacing.xs) {
                        Circle()
                            .fill(PartyStyle.color(party.party))
                            .frame(width: 10, height: 10)
                        Text(PartyStyle.label(party.party))
                            .font(.system(size: ThemeTokens.Text.m, weight: .semibold))
                            .lineLimit(1)
                    }
                    Text("\(party.seats)")
                        .font(.display(ThemeTokens.Display.poster))
                        .monospacedDigit()
                }
                .frame(width: 120, alignment: .leading)
                Rectangle()
                    .fill(ThemeColor.border)
                    .frame(width: ThemeTokens.Stroke.s)
                VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
                    Text("\(Copy.seats) · \(Formatters.percent(Double(party.seats) / Double(max(totalSeats, 1))))")
                        .kicker()
                    StatBar(label: Copy.cohesion, value: party.cohesion)
                    StatBar(label: Copy.attendance, value: party.attendance)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(.vertical, ThemeTokens.Spacing.s)
            Rectangle()
                .fill(ThemeColor.border)
                .frame(height: ThemeTokens.Stroke.s)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
