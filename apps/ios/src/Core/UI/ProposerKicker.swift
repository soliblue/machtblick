import SwiftUI

struct ProposerKicker: View {
    let party: String

    var body: some View {
        if PartyStyle.hasLogo(party) {
            PartyLogo(party: party)
        } else {
            Text(PartyStyle.label(party))
                .kicker()
                .lineLimit(1)
                .truncationMode(.tail)
        }
    }
}
