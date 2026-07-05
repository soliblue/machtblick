import SwiftUI

struct PartyCardView: View {
    let party: PartyListItem
    let totalSeats: Int

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
            HStack(spacing: ThemeTokens.Spacing.xs) {
                Circle()
                    .fill(PartyStyle.color(party.party))
                    .frame(width: 10, height: 10)
                Text(PartyStyle.label(party.party))
                    .font(.system(size: ThemeTokens.Text.m, weight: .semibold))
                    .lineLimit(1)
            }
            Text("\(party.seats)")
                .font(.display(32))
                .monospacedDigit()
            Text("\(Copy.seats) · \(Formatters.percent(Double(party.seats) / Double(max(totalSeats, 1))))")
                .kicker()
            StatBar(label: Copy.cohesion, value: party.cohesion)
            StatBar(label: Copy.attendance, value: party.attendance)
        }
        .padding(ThemeTokens.Spacing.m)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(Rectangle().strokeBorder(ThemeColor.border, lineWidth: ThemeTokens.Stroke.s))
    }
}
