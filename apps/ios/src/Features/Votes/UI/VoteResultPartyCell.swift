import SwiftUI

struct VoteResultPartyCell: View {
    let voteId: String
    let row: VoteResultRow

    var body: some View {
        Group {
            if let party = row.party {
                NavigationLink(value: AppRoute.party(PartyStyle.slug(party))) {
                    Text(PartyStyle.label(party))
                        .font(.system(size: ThemeTokens.Text.m))
                        .foregroundStyle(ThemeColor.fg)
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("vote-result-party-\(voteId)-\(PartyStyle.slug(party))")
            } else {
                Text(Copy.resultTotal)
                    .font(.system(size: ThemeTokens.Text.m, weight: .semibold))
                    .foregroundStyle(ThemeColor.fg)
            }
        }
        .fixedSize(horizontal: true, vertical: false)
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.leading, ThemeTokens.Spacing.m)
        .padding(.trailing, ThemeTokens.Spacing.s)
        .padding(.vertical, ThemeTokens.Spacing.l)
        .frame(height: row.party == nil ? ThemeTokens.Display.poster + ThemeTokens.Spacing.l * 2 : nil)
    }
}
