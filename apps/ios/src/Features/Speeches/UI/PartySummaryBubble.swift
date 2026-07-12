import SwiftUI

struct PartySummaryBubble: View {
    let summary: PartySummaryReader
    var speakers: [AvatarPile.Person] = []

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
            HStack(spacing: ThemeTokens.Spacing.s) {
                logo
                Spacer(minLength: ThemeTokens.Spacing.s)
                if !speakers.isEmpty {
                    AvatarPile(people: speakers)
                }
            }
            Text(summary.positionSummary ?? "")
                .font(.serif(ThemeTokens.Text.l))
                .foregroundStyle(ThemeColor.fg)
                .multilineTextAlignment(.leading)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(ThemeTokens.Spacing.m)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(
            PartySurface(
                party: PartyStyle.hasPartyLine(summary.party) ? summary.party : nil
            )
        )
    }

    @ViewBuilder private var logo: some View {
        if PartyStyle.hasPartyLine(summary.party) {
            NavigationLink(value: AppRoute.party(PartyStyle.slug(summary.party))) { logoMark }
                .buttonStyle(.plain)
        } else {
            logoMark
        }
    }

    @ViewBuilder private var logoMark: some View {
        if PartyStyle.hasLogo(summary.party) {
            PartyLogo(party: summary.party, size: ThemeTokens.Icon.xl)
        } else {
            Text(PartyStyle.label(summary.party))
                .font(.system(size: ThemeTokens.Text.l, weight: .semibold))
                .foregroundStyle(PartyStyle.color(summary.party))
        }
    }
}
