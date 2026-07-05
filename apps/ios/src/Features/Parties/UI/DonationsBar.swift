import SwiftUI

struct DonationsBar: View {
    let donations: [PartyDetailPayload.Donation]
    let totalEur: Int

    private var sorted: [PartyDetailPayload.Donation] {
        donations.sorted { $0.amountEur > $1.amountEur }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
            HStack {
                Text(Copy.donationsSection).kicker()
                Spacer()
                Text("\(donations.count) · \(Formatters.euro(totalEur))")
                    .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
                    .monospacedDigit()
            }
            GeometryReader { geo in
                HStack(spacing: 2) {
                    ForEach(Array(sorted.enumerated()), id: \.element.id) { index, donation in
                        Rectangle()
                            .fill(ThemeColor.fg.opacity(index.isMultiple(of: 2) ? ThemeTokens.Opacity.l : ThemeTokens.Opacity.m))
                            .frame(width: width(donation, in: geo.size.width))
                    }
                }
            }
            .frame(height: 32)
            VStack(spacing: 0) {
                ForEach(sorted) { donation in
                    HStack(alignment: .firstTextBaseline, spacing: ThemeTokens.Spacing.s) {
                        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
                            Text(donation.donor)
                                .font(.system(size: ThemeTokens.Text.m))
                                .multilineTextAlignment(.leading)
                            Text(Formatters.shortDate(donation.dateReceived)).kicker()
                        }
                        Spacer()
                        Text(Formatters.euro(donation.amountEur))
                            .font(.system(size: ThemeTokens.Text.m, weight: .semibold))
                            .monospacedDigit()
                    }
                    .padding(.vertical, ThemeTokens.Spacing.s)
                    .overlay(alignment: .top) {
                        Rectangle().fill(ThemeColor.border).frame(height: ThemeTokens.Stroke.s)
                    }
                }
            }
        }
    }

    private func width(_ donation: PartyDetailPayload.Donation, in total: CGFloat) -> CGFloat {
        let sum = sorted.reduce(0) { $0 + $1.amountEur }
        let gaps = CGFloat(max(sorted.count - 1, 0)) * 2
        return (total - gaps) * CGFloat(donation.amountEur) / CGFloat(max(sum, 1))
    }
}
