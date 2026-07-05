import SwiftUI

struct PartyLogo: View {
    let party: String
    var size: CGFloat = ThemeTokens.Icon.m

    var body: some View {
        Image("party-\(PartyStyle.slug(party))")
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(height: size)
    }
}
