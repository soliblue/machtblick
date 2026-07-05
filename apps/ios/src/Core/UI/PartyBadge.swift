import SwiftUI

struct PartyBadge: View {
    let party: String

    var body: some View {
        Text(PartyStyle.label(party))
            .font(.system(size: ThemeTokens.Text.s, weight: .semibold))
            .foregroundStyle(PartyStyle.color(party))
            .padding(.horizontal, ThemeTokens.Spacing.s)
            .padding(.vertical, ThemeTokens.Spacing.xs)
            .background(PartyStyle.color(party).opacity(ThemeTokens.Opacity.s))
    }
}
