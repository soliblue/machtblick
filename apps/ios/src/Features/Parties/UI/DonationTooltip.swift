import SwiftUI

struct DonationTooltip: View {
    let donation: PartyDetailPayload.Donation

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.xs) {
            Text(donation.donor)
                .font(.system(size: ThemeTokens.Text.m, weight: .semibold))
                .multilineTextAlignment(.leading)
            Text(Formatters.euro(donation.amountEur))
                .font(.system(size: ThemeTokens.Text.m))
                .monospacedDigit()
            Text(Formatters.shortDate(donation.dateReceived)).kicker()
        }
        .padding(ThemeTokens.Spacing.m)
    }
}
