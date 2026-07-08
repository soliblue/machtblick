import SwiftUI

struct PartySummaryBubble: View {
    let summary: PartySummaryReader
    var speakers: [AvatarPile.Person] = []

    var body: some View {
        VStack(alignment: .leading, spacing: ThemeTokens.Spacing.s) {
            identity
            if !speakers.isEmpty {
                AvatarPile(people: speakers)
            }
            Text(summary.positionSummary ?? "")
                .font(.serif(ThemeTokens.Text.l))
                .foregroundStyle(ThemeColor.fg)
                .multilineTextAlignment(.leading)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(ThemeTokens.Spacing.m)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 16).fill(tint))
    }

    @ViewBuilder private var identity: some View {
        if PartyStyle.hasPartyLine(summary.party) {
            NavigationLink(value: AppRoute.party(PartyStyle.slug(summary.party))) { identityContent }
                .buttonStyle(.plain)
        } else {
            identityContent
        }
    }

    private var identityContent: some View {
        HStack(spacing: ThemeTokens.Spacing.s) {
            if PartyStyle.hasLogo(summary.party) {
                PartyLogo(party: summary.party, size: ThemeTokens.Icon.m)
            }
            Text(PartyStyle.label(summary.party))
                .font(.system(size: ThemeTokens.Text.l, weight: .semibold))
                .foregroundStyle(ThemeColor.fg)
        }
    }

    private var tint: Color {
        PartyStyle.hasPartyLine(summary.party)
            ? PartyStyle.color(summary.party).opacity(0.13)
            : ThemeColor.surface
    }
}
